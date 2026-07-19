"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { Types } from "mongoose";
import connectToDb from "@/lib/utils/db";
import { requireSalerSession, requireActiveAnnee } from "@/lib/auth/require-saler";
import type { ActionResult } from "@/lib/utils/action-result";
import { publishTenantEvent } from "@/lib/utils/realtime";
import Commande from "@/lib/models/Commande";
import Customer from "@/lib/models/Customer";
import Product from "@/lib/models/Product";
import Promotion from "@/lib/models/Promotion";
import Stock from "@/lib/models/Stock";
import Depense from "@/lib/models/Depense";
import SupplyRequest from "@/lib/models/SupplyRequest";
import { requireTenantSession } from "@/lib/auth/require-tenant";

const oid = (value: string) => new Types.ObjectId(value);
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ref = (prefix: string) => `${prefix}-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
const normalizePhone = (value: string) => value.replace(/[^\d+]/g, "").trim();

async function scope(slug: string) {
  const context = await requireSalerSession();
  const annee = await requireActiveAnnee(context, slug);
  return { context, annee };
}

export async function getWorkspaceHeader(slug: string) {
  try {
    const data = await scope(slug);
    return { success: true, message: "Contexte charge.", data: { store: { id: data.context.storeId, designation: data.context.storeDesignation, reference: data.context.storeReference }, annee: data.annee } } as const;
  } catch {
    return { success: false, message: "Aucun exercice actif n’est disponible pour enregistrer cette opération. Contactez le gestionnaire de votre entreprise." } as const;
  }
}

export async function searchCustomers(phone: string): Promise<ActionResult<Array<{ id: string; name: string; phone: string; email: string; matricule: string }>>> {
  try {
    const context = await requireSalerSession();
    const normalized = normalizePhone(phone);
    if (normalized.length < 5) return { success: true, message: "Recherche.", data: [] };
    const customers = await Customer.find({ tenantId: oid(context.tenantId), phone: { $regex: escapeRegex(normalized), $options: "i" } }).select("name phone email matricule").limit(8).lean();
    return { success: true, message: "Clients trouves.", data: customers.map(c => ({ id: c._id.toString(), name: c.name, phone: c.phone, email: c.email ?? "", matricule: c.matricule })) };
  } catch (error: any) { return { success: false, message: error.message || "Erreur recherche client." }; }
}

export async function createWorkspaceCustomer(input: { name: string; phone: string; email?: string }): Promise<ActionResult<{ id: string; name: string; phone: string; email: string; matricule: string }>> {
  try {
    const context = await requireSalerSession();
    const phone = normalizePhone(input.phone);
    if (input.name.trim().length < 2 || phone.length < 8) return { success: false, message: "Nom ou telephone invalide." };
    const existing = await Customer.findOne({ tenantId: oid(context.tenantId), phone }).lean();
    if (existing) return { success: false, message: "Ce client existe deja." };
    const customer = await Customer.create({ tenantId: oid(context.tenantId), name: input.name.trim(), phone, email: input.email?.trim().toLowerCase() || undefined, matricule: `CLI-${randomBytes(4).toString("hex").toUpperCase()}` });
    return { success: true, message: "Client cree.", data: { id: customer._id.toString(), name: customer.name, phone: customer.phone, email: customer.email ?? "", matricule: customer.matricule } };
  } catch (error: any) { return { success: false, message: error.message || "Erreur creation client." }; }
}

export async function getSaleProducts(slug: string, search = "") {
  try {
    const { context, annee } = await scope(slug);
    const stock = await Stock.findOne({ shopId: oid(context.storeId), anneeId: oid(annee.id), status: "ACTIVE" }).populate({ path: "stocks.product", match: { tenantId: oid(context.tenantId), status: "ACTIVE", ...(search ? { $or: [{ designation: { $regex: escapeRegex(search), $options: "i" } }, { code: { $regex: escapeRegex(search), $options: "i" } }] } : {}) }, select: "designation code price photos" }).lean();
    const data = (stock?.stocks ?? []).filter(s => (s.product as any)?._id).map(s => { const p = s.product as any; return { id: p._id.toString(), designation: p.designation, code: p.code, price: p.price ?? [], photo: p.photos?.[0]?.url ?? null, quantity: s.qte }; });
    return { success: true, message: "Produits charges.", data } as const;
  } catch (error: any) { return { success: false, message: error.message || "Erreur produits." } as const; }
}

export async function createSale(slug: string, input: { customerId: string; lines: Array<{ productId: string; quantity: number }>; promotionId?: string }): Promise<ActionResult<{ id: string; reference: string }>> {
  const db = await connectToDb();
  const session = await db.startSession();
  try {
    const { context, annee } = await scope(slug);
    if (!Types.ObjectId.isValid(input.customerId) || !input.lines.length) return { success: false, message: "Client ou produits invalides." };
    let created: any;
    await session.withTransaction(async () => {
      const customer = await Customer.findOne({ _id: input.customerId, tenantId: context.tenantId }).session(session).lean();
      if (!customer) throw new Error("CLIENT_INVALID");
      const ids = [...new Set(input.lines.map(l => l.productId))];
      if (ids.length !== input.lines.length || ids.some(id => !Types.ObjectId.isValid(id))) throw new Error("PRODUCT_INVALID");
      const products = await Product.find({ _id: { $in: ids.map(oid) }, tenantId: oid(context.tenantId), status: "ACTIVE" }).session(session).lean();
      if (products.length !== ids.length) throw new Error("PRODUCT_INVALID");
      let currency = ""; let subtotal = 0;
      const lines = input.lines.map(line => {
        if (!Number.isInteger(line.quantity) || line.quantity < 1) throw new Error("QUANTITY_INVALID");
        const product = products.find(p => p._id.toString() === line.productId)!;
        const price = product.price[0]; if (!price) throw new Error("PRICE_MISSING");
        if (currency && currency !== price.currency) throw new Error("MIXED_CURRENCY"); currency = price.currency;
        const total = price.amount * line.quantity; subtotal += total;
        return { product: product._id, designation: product.designation, code: product.code, qte: line.quantity, unitPrice: price.amount, currency: price.currency, reduction: 0, total };
      });
      let promotion: any = null; let discountAmount = 0;
      const promotionIds = customer.promotions ?? [];
      const candidates = await Promotion.find({ _id: { $in: promotionIds }, tenantId: oid(context.tenantId), status: "ACTIVE" }).session(session).lean();
      const selected = input.promotionId ? candidates.find(p => p._id.toString() === input.promotionId) : candidates.sort((a,b) => b.reduction-a.reduction)[0];
      if (selected) { discountAmount = Math.round((subtotal * selected.reduction) / 100); promotion = { promotionId: selected._id, designation: selected.designation, code: selected.code, reduction: selected.reduction, discountAmount }; }
      for (const line of lines) {
        const updated = await Stock.updateOne({ shopId: oid(context.storeId), anneeId: oid(annee.id), status: "ACTIVE", stocks: { $elemMatch: { product: line.product, qte: { $gte: line.qte } } } }, { $inc: { "stocks.$[item].qte": -line.qte } }, { arrayFilters: [{ "item.product": line.product }], session });
        if (updated.modifiedCount !== 1) throw new Error("INSUFFICIENT_STOCK");
      }
      const reference = ref("CMD");
      [created] = await Commande.create([{ tenantId: oid(context.tenantId), agentId: oid(context.salerId), commandes: lines, anneeId: oid(annee.id), clientId: oid(input.customerId), currency, shopId: oid(context.storeId), promotion, subtotal, discountAmount, totalAmount: subtotal - discountAmount, status: "CONFIRMED", reference, invoice: { generatedAt: new Date() } }], { session });
    });
    await publishTenantEvent((await requireSalerSession()).tenantId, "commandes", "commande.created", { id: created._id.toString(), reference: created.reference, storeId: created.shopId.toString(), salerId: created.agentId.toString(), totalAmount: created.totalAmount, currency: created.currency, status: created.status, createdAt: created.createdAt.toISOString() });
    revalidatePath(`/commandes/${slug}`);
    return { success: true, message: "Vente enregistree.", data: { id: created._id.toString(), reference: created.reference } };
  } catch (error: any) { return { success: false, message: error.message || "Erreur creation vente." }; } finally { await session.endSession(); }
}

export async function listSales(slug: string, page = 1, search = "", status = "") {
  try { const { context, annee } = await scope(slug); const match: any = { tenantId: oid(context.tenantId), shopId: oid(context.storeId), anneeId: oid(annee.id) }; if (status) match.status = status; if (search) match.reference = { $regex: escapeRegex(search), $options: "i" }; const [items,total] = await Promise.all([Commande.find(match).populate("clientId","name phone").sort({createdAt:-1}).skip((page-1)*12).limit(12).lean(),Commande.countDocuments(match)]); return { success:true,message:"Ventes chargees.",data:{items:items.map(c=>({id:c._id.toString(),reference:c.reference,customerName:(c.clientId as any)?.name??"",phone:(c.clientId as any)?.phone??"",totalAmount:c.totalAmount,currency:c.currency,status:c.status,productCount:c.commandes.length,createdAt:c.createdAt.toISOString()})),total,page,totalPages:Math.max(1,Math.ceil(total/12))} } as const; } catch(error:any){return{success:false,message:error.message||"Erreur ventes."}as const;}
}

export async function cancelSale(slug:string,id:string){try{const{context,annee}=await scope(slug);if(!Types.ObjectId.isValid(id))return{success:false,message:"Vente invalide."}as const;const sale=await Commande.findOne({_id:id,tenantId:context.tenantId,shopId:context.storeId,anneeId:annee.id,status:{$ne:"CANCELLED"}}).lean();if(!sale)return{success:false,message:"Vente introuvable."}as const;for(const line of sale.commandes)await Stock.updateOne({shopId:context.storeId,anneeId:annee.id,"stocks.product":line.product},{$inc:{"stocks.$.qte":line.qte}});await Commande.updateOne({_id:id},{$set:{status:"CANCELLED"}});await publishTenantEvent(context.tenantId,"commandes","commande.updated",{id,reference:sale.reference,storeId:context.storeId,salerId:context.salerId,status:"CANCELLED"});revalidatePath(`/commandes/${slug}`);return{success:true,message:"Vente annulee.",data:null}as const;}catch(error:any){return{success:false,message:error.message||"Erreur annulation."}as const;}}

export async function listExpenses(slug:string,page=1,search="",status=""){try{const{context,annee}=await scope(slug);const match:any={tenantId:oid(context.tenantId),shopId:oid(context.storeId),anneeId:oid(annee.id)};if(status)match.status=status;if(search)match.reference={$regex:escapeRegex(search),$options:"i"};const[items,total]=await Promise.all([Depense.find(match).sort({createdAt:-1}).skip((page-1)*12).limit(12).lean(),Depense.countDocuments(match)]);return{success:true,message:"Depenses chargees.",data:{items:items.map(d=>({id:d._id.toString(),reference:d.reference,lines:d.depenses,totalAmount:d.totalAmount,currency:d.currency,status:d.status,createdAt:d.createdAt.toISOString(),canEdit:d.agentId.toString()===context.userId})),total,page,totalPages:Math.max(1,Math.ceil(total/12))}}as const;}catch(error:any){return{success:false,message:error.message||"Erreur depenses."}as const;}}

export async function createExpense(slug:string,input:{currency:"USD"|"CDF";lines:Array<{libelle:string;amount:number;observation?:string}>}){try{const{context,annee}=await scope(slug);if(!["USD","CDF"].includes(input.currency)||!input.lines.length||input.lines.some(l=>l.libelle.trim().length<2||!Number.isFinite(l.amount)||l.amount<=0))return{success:false,message:"Lignes invalides."}as const;const totalAmount=input.lines.reduce((s,l)=>s+l.amount,0);const expense=await Depense.create({tenantId:context.tenantId,anneeId:annee.id,shopId:context.storeId,agentId:context.userId,currency:input.currency,totalAmount,status:"PENDING",reference:ref("DEP"),depenses:input.lines.map(l=>({...l,libelle:l.libelle.trim(),status:"PENDING"}))});await publishTenantEvent(context.tenantId,"depenses","depense.created",{id:expense._id.toString(),reference:expense.reference,storeId:context.storeId,salerId:context.salerId,totalAmount,currency:input.currency,status:expense.status,createdAt:expense.createdAt.toISOString()});revalidatePath(`/depenses/${slug}`);return{success:true,message:"Depense creee.",data:{id:expense._id.toString()}}as const;}catch(error:any){return{success:false,message:error.message||"Erreur depense."}as const;}}

export async function cancelExpense(slug:string,id:string){try{const{context,annee}=await scope(slug);const result=await Depense.updateOne({_id:id,tenantId:context.tenantId,shopId:context.storeId,anneeId:annee.id,agentId:context.userId,status:"PENDING"},{$set:{status:"CANCELLED"}});if(result.modifiedCount!==1)return{success:false,message:"Depense non modifiable."}as const;await publishTenantEvent(context.tenantId,"depenses","depense.updated",{id,storeId:context.storeId,salerId:context.salerId,anneeId:annee.id,status:"CANCELLED",createdAt:new Date().toISOString()});revalidatePath(`/depenses/${slug}`);return{success:true,message:"Depense annulee.",data:null}as const;}catch(error:any){return{success:false,message:error.message||"Erreur annulation."}as const;}}

export async function listSupplyRequests(slug:string,page=1,status=""){try{const{context,annee}=await scope(slug);const match:any={tenantId:oid(context.tenantId),shopId:oid(context.storeId),anneeId:oid(annee.id),agentId:oid(context.salerId)};if(status)match.status=status;const[items,total,stock]=await Promise.all([SupplyRequest.find(match).populate("products.product","designation code").sort({createdAt:-1}).skip((page-1)*12).limit(12).lean(),SupplyRequest.countDocuments(match),Stock.findOne({shopId:context.storeId,anneeId:annee.id}).lean()]);return{success:true,message:"Demandes chargees.",data:{items:items.map(r=>({id:r._id.toString(),reference:r.reference,products:r.products.map(p=>({id:(p.product as any)?._id?.toString(),designation:(p.product as any)?.designation,qte:p.qte})),status:r.status,description:r.description??"",createdAt:r.createdAt.toISOString()})),total,page,totalPages:Math.max(1,Math.ceil(total/12)),stock:(stock?.stocks??[]).map(s=>({productId:s.product.toString(),qte:s.qte}))}}as const;}catch(error:any){return{success:false,message:error.message||"Erreur stocks."}as const;}}

export async function createSupplyRequest(slug:string,input:{description?:string;products:Array<{productId:string;qte:number}>}){try{const{context,annee}=await scope(slug);if(!input.products.length||input.products.some(p=>!Types.ObjectId.isValid(p.productId)||!Number.isInteger(p.qte)||p.qte<1))return{success:false,message:"Produits invalides."}as const;const ids=[...new Set(input.products.map(p=>p.productId))];const products=await Product.find({_id:{$in:ids.map(oid)},tenantId:context.tenantId,status:"ACTIVE"}).select("_id").lean();if(products.length!==ids.length)return{success:false,message:"Produit non autorise."}as const;const request=await SupplyRequest.create({tenantId:context.tenantId,anneeId:annee.id,shopId:context.storeId,agentId:context.salerId,products:input.products.map(p=>({product:oid(p.productId),qte:p.qte})),reference:ref("STK"),description:input.description?.trim(),status:"PENDING"});await publishTenantEvent(context.tenantId,"stocks","stock.requested",{id:request._id.toString(),reference:request.reference,storeId:context.storeId,salerId:context.salerId,productCount:request.products.length,status:request.status,createdAt:request.createdAt.toISOString()});revalidatePath(`/stocks/${slug}`);revalidatePath("/","layout");return{success:true,message:"Demande envoyee.",data:{id:request._id.toString()}}as const;}catch(error:any){return{success:false,message:error.message||"Erreur demande."}as const;}}

export async function cancelSupplyRequest(slug:string,id:string){try{const{context,annee}=await scope(slug);const result=await SupplyRequest.updateOne({_id:id,tenantId:context.tenantId,shopId:context.storeId,anneeId:annee.id,agentId:context.salerId,status:"PENDING"},{$set:{status:"CANCELLED"}});if(result.modifiedCount!==1)return{success:false,message:"Demande non annulable."}as const;await publishTenantEvent(context.tenantId,"stocks","stock.updated",{id,storeId:context.storeId,salerId:context.salerId,anneeId:annee.id,status:"CANCELLED",createdAt:new Date().toISOString()});revalidatePath(`/stocks/${slug}`);return{success:true,message:"Demande annulee.",data:null}as const;}catch(error:any){return{success:false,message:error.message||"Erreur annulation."}as const;}}

export async function listCustomers(page=1,search=""){try{const context=await requireSalerSession();const match:any={tenantId:oid(context.tenantId)};if(search)match.$or=[{name:{$regex:escapeRegex(search),$options:"i"}},{phone:{$regex:escapeRegex(search),$options:"i"}},{matricule:{$regex:escapeRegex(search),$options:"i"}}];const[items,total]=await Promise.all([Customer.find(match).populate("promotions","designation code reduction status").sort({createdAt:-1}).skip((page-1)*12).limit(12).lean(),Customer.countDocuments(match)]);const ids=items.map(i=>i._id);const stats=await Commande.aggregate([{$match:{tenantId:oid(context.tenantId),clientId:{$in:ids}}},{$group:{_id:"$clientId",count:{$sum:1},total:{$sum:"$totalAmount"},last:{$max:"$createdAt"}}}]);return{success:true,message:"Clients charges.",data:{items:items.map(c=>{const s=stats.find(x=>x._id.toString()===c._id.toString());return{id:c._id.toString(),name:c.name,phone:c.phone,email:c.email??"",matricule:c.matricule,promotions:(c.promotions as any[])??[],orderCount:s?.count??0,total:s?.total??0,lastOrder:s?.last?.toISOString()??null,createdAt:c.createdAt.toISOString()}}),total,page,totalPages:Math.max(1,Math.ceil(total/12))}}as const;}catch(error:any){return{success:false,message:error.message||"Erreur clients."}as const;}}

export async function getCustomerDetail(id:string){try{const context=await requireSalerSession();if(!Types.ObjectId.isValid(id))return{success:false,message:"Client invalide."}as const;const customer=await Customer.findOne({_id:id,tenantId:context.tenantId}).populate("promotions","designation code reduction status").lean();if(!customer)return{success:false,message:"Client introuvable."}as const;const orders=await Commande.find({tenantId:context.tenantId,clientId:id}).select("reference totalAmount currency status invoice createdAt").sort({createdAt:-1}).limit(20).lean();return{success:true,message:"Detail charge.",data:{customer:{id:customer._id.toString(),name:customer.name,phone:customer.phone,email:customer.email??"",matricule:customer.matricule,createdAt:customer.createdAt.toISOString(),promotions:(customer.promotions as any[])??[]},orders:orders.map(o=>({id:o._id.toString(),reference:o.reference,totalAmount:o.totalAmount,currency:o.currency,status:o.status,invoice:Boolean(o.invoice),createdAt:o.createdAt.toISOString()}))}}as const;}catch(error:any){return{success:false,message:error.message||"Erreur detail."}as const;}}

export async function updateCustomer(id:string,input:{name:string;phone:string;email?:string}){try{const context=await requireSalerSession();const phone=normalizePhone(input.phone);const result=await Customer.updateOne({_id:id,tenantId:context.tenantId},{$set:{name:input.name.trim(),phone,email:input.email?.trim().toLowerCase()||undefined}});if(!result.matchedCount)return{success:false,message:"Client introuvable."}as const;revalidatePath("/clients");return{success:true,message:"Client modifie.",data:null}as const;}catch(error:any){return{success:false,message:error.message||"Erreur modification."}as const;}}

export async function listAvailablePromotions(customerId:string){try{const context=await requireSalerSession();const customer=await Customer.findOne({_id:customerId,tenantId:context.tenantId}).lean();if(!customer)return{success:false,message:"Client introuvable."}as const;const promotions=await Promotion.find({tenantId:context.tenantId,status:"ACTIVE",_id:{$nin:customer.promotions??[]}}).select("designation code reduction").limit(30).lean();return{success:true,message:"Promotions chargees.",data:promotions.map(p=>({id:p._id.toString(),designation:p.designation,code:p.code,reduction:p.reduction}))}as const;}catch(error:any){return{success:false,message:error.message||"Erreur promotions."}as const;}}

export async function setCustomerPromotion(customerId:string,promotionId:string,remove=false){try{const context=await requireSalerSession();const promotion=await Promotion.findOne({_id:promotionId,tenantId:context.tenantId,status:"ACTIVE"}).lean();if(!promotion&&!remove)return{success:false,message:"Promotion invalide."}as const;const update=remove?{$pull:{promotions:oid(promotionId)}}:{$addToSet:{promotions:oid(promotionId)}};const result=await Customer.updateOne({_id:customerId,tenantId:context.tenantId},update);if(!result.matchedCount)return{success:false,message:"Client introuvable."}as const;revalidatePath("/clients");return{success:true,message:remove?"Promotion retiree.":"Promotion associee.",data:null}as const;}catch(error:any){return{success:false,message:error.message||"Erreur promotion."}as const;}}

export async function getTenantSupplyRequests(){try{const{tenantId}=await requireTenantSession();const requests=await SupplyRequest.find({tenantId:oid(tenantId),status:"PENDING"}).populate("shopId","designation").populate("products.product","designation code").sort({createdAt:-1}).limit(20).lean();return{success:true,message:"Notifications chargees.",data:requests.map(r=>({id:r._id.toString(),reference:r.reference,store:(r.shopId as any)?.designation??"Boutique",productCount:r.products.length,createdAt:r.createdAt.toISOString()}))}as const;}catch(error:any){return{success:false,message:error.message||"Erreur notifications."}as const;}}

export async function reviewSupplyRequest(id:string,decision:"APPROVED"|"REJECTED"){const db=await connectToDb();const mongoSession=await db.startSession();try{const{tenantId}=await requireTenantSession();if(!Types.ObjectId.isValid(id)||!["APPROVED","REJECTED"].includes(decision))return{success:false,message:"Decision invalide."}as const;let request:any;await mongoSession.withTransaction(async()=>{request=await SupplyRequest.findOne({_id:id,tenantId:oid(tenantId),status:"PENDING"}).session(mongoSession);if(!request)throw new Error("REQUEST_NOT_PENDING");if(decision==="APPROVED"){for(const item of request.products){const result=await Stock.updateOne({shopId:request.shopId,anneeId:request.anneeId,"stocks.product":item.product},{$inc:{"stocks.$.qte":item.qte}},{session:mongoSession});if(result.modifiedCount!==1)throw new Error("STOCK_ITEM_MISSING");}}request.status=decision;request.reviewedBy=oid(tenantId);request.reviewedAt=new Date();await request.save({session:mongoSession});});await publishTenantEvent(tenantId,"stocks","stock.updated",{id,reference:request.reference,storeId:request.shopId.toString(),status:decision});revalidatePath("/","layout");return{success:true,message:decision==="APPROVED"?"Approvisionnement valide.":"Demande rejetee.",data:null}as const;}catch(error:any){return{success:false,message:error.message||"Erreur validation."}as const;}finally{await mongoSession.endSession();}}
