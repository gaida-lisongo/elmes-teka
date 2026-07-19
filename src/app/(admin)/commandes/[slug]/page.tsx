import { redirect } from "next/navigation";
import { getWorkspaceHeader, listSales, getSaleProducts } from "@/actions/workspace.actions";
import SalesClient from "./SalesClient";
export default async function Page({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{page?:string;search?:string;status?:string}>}){const{slug}=await params;const sp=await searchParams;const[header,sales,products]=await Promise.all([getWorkspaceHeader(slug),listSales(slug,Number(sp.page)||1,sp.search??"",sp.status??""),getSaleProducts(slug)]);if(!header.success)redirect("/");return <SalesClient slug={slug} header={header.data} initialSales={sales.success?sales.data:null} initialProducts={products.success?products.data:[]}/>;}
