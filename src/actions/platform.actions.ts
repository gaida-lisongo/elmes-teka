"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Types } from "mongoose";

import {
  clearPlatformAdminSession,
  consumeAdminMagicLink,
  createAdminMagicLink,
  isAdminEmail,
  getPlatformAdmin,
} from "@/lib/auth/platform-admin";
import PlatformPromo from "@/lib/models/PlatformPromo";
import { normalizeCode } from "@/lib/payments/pricing";
import connectToDb from "@/lib/utils/db";
import { sendMail } from "@/lib/utils/mail";

export type PlatformActionResponse =
  | { success: true; message: string }
  | { success: false; message: string; errors?: Record<string, string> };

/* ───── Connexion par lien magique ───── */

export async function requestAdminMagicLink(email: string): Promise<PlatformActionResponse> {
  // Même réponse que l'adresse soit autorisée ou non : rien n'est révélé.
  const neutral = { success: true, message: "Si cette adresse est autorisee, un lien de connexion vient d'etre envoye." } as const;
  const normalized = (email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { success: false, message: "Adresse e-mail invalide.", errors: { email: "Adresse e-mail invalide." } };
  }
  if (!isAdminEmail(normalized)) return neutral;
  try {
    const link = await createAdminMagicLink(normalized, 30);
    await sendMail({
      to: normalized,
      subject: "[ELMES-TEKA] Votre lien de connexion administrateur",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
  <h2 style="color:#1C2B4B">Connexion au dashboard plateforme</h2>
  <p>Cliquez sur le bouton ci-dessous pour vous connecter. Le lien est valable 30 minutes et ne fonctionne qu'une fois.</p>
  <p><a href="${link}" style="background:#22C55E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Se connecter</a></p>
  <p style="color:#9ca3af;font-size:12px">Si vous n'avez pas demande ce lien, ignorez ce message.</p>
</div>`,
    });
  } catch (error) {
    console.error("[PLATFORM LOGIN] envoi du lien impossible", error);
    return { success: false, message: "Le lien n'a pas pu etre envoye. Reessayez dans un instant." };
  }
  return neutral;
}

/** Consomme le lien (POST, pour que les scanners de liens des messageries ne l'utilisent pas). */
export async function signInWithMagicLink(formData: FormData): Promise<void> {
  const ok = await consumeAdminMagicLink(String(formData.get("token") ?? ""));
  redirect(ok ? "/platform" : "/platform/login?expired=1");
}

export async function logoutPlatformAdmin(): Promise<void> {
  await clearPlatformAdminSession();
  redirect("/platform/login");
}

/* ───── Codes promo plateforme ───── */

export interface PlatformPromoInput {
  code: string;
  label: string;
  reduction: number;
  startsAt: string;
  endsAt: string;
  maxUses: number | null;
  isPublic: boolean;
}

export async function createPlatformPromo(input: PlatformPromoInput): Promise<PlatformActionResponse> {
  try {
    const admin = await getPlatformAdmin();
    if (!admin) return { success: false, message: "Session administrateur expiree." };
    await connectToDb();

    const code = normalizeCode(input.code);
    const label = (input.label ?? "").trim();
    const reduction = Number(input.reduction);
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    // La date de fin inclut toute la journée
    endsAt.setUTCHours(23, 59, 59, 999);
    const maxUses = input.maxUses === null || input.maxUses === undefined || `${input.maxUses}` === "" ? null : Number(input.maxUses);

    const errors: Record<string, string> = {};
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) errors.code = "3 a 30 caracteres : lettres, chiffres, - ou _.";
    if (label.length < 2) errors.label = "Donnez un nom a ce code (ex. Conference Kinshasa 2026).";
    if (!Number.isFinite(reduction) || reduction < 1 || reduction > 100) errors.reduction = "Entre 1 et 100 %.";
    if (Number.isNaN(startsAt.getTime())) errors.startsAt = "Date de debut invalide.";
    if (Number.isNaN(endsAt.getTime())) errors.endsAt = "Date de fin invalide.";
    else if (!errors.startsAt && endsAt <= startsAt) errors.endsAt = "La fin doit etre apres le debut.";
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) errors.maxUses = "Nombre entier superieur a 0, ou vide pour illimite.";
    if (Object.keys(errors).length) return { success: false, message: "Certaines informations sont invalides.", errors };

    if (await PlatformPromo.exists({ code })) {
      return { success: false, message: "Ce code existe deja.", errors: { code: "Ce code existe deja." } };
    }

    await PlatformPromo.create({ code, label, reduction, startsAt, endsAt, maxUses, isPublic: Boolean(input.isPublic), createdBy: admin.email });
    revalidatePath("/platform/promos");
    revalidatePath("/");
    return { success: true, message: `Code ${code} cree.` };
  } catch (error: any) {
    return { success: false, message: error.message || "Creation impossible." };
  }
}

export async function updatePlatformPromoFlags(
  id: string,
  flags: { status?: "ACTIVE" | "INACTIVE"; isPublic?: boolean }
): Promise<PlatformActionResponse> {
  try {
    if (!(await getPlatformAdmin())) return { success: false, message: "Session administrateur expiree." };
    await connectToDb();
    if (!Types.ObjectId.isValid(id)) return { success: false, message: "Code invalide." };
    const set: Record<string, unknown> = {};
    if (flags.status === "ACTIVE" || flags.status === "INACTIVE") set.status = flags.status;
    if (typeof flags.isPublic === "boolean") set.isPublic = flags.isPublic;
    const result = await PlatformPromo.updateOne({ _id: id }, { $set: set });
    if (!result.matchedCount) return { success: false, message: "Code introuvable." };
    revalidatePath("/platform/promos");
    revalidatePath("/");
    return { success: true, message: "Code mis a jour." };
  } catch (error: any) {
    return { success: false, message: error.message || "Mise a jour impossible." };
  }
}
