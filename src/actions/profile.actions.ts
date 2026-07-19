"use server";

import { revalidatePath } from "next/cache";
import { requireSalerSession } from "@/lib/auth/require-saler";
import { requireTenantSession } from "@/lib/auth/require-tenant";
import { getSession } from "@/lib/auth/session";
import { User, Tenant, Saler } from "@/lib/models/User";
import connectToDb from "@/lib/utils/db";
import type { ActionResult } from "@/lib/utils/action-result";

export interface UserProfile {
  id: string;
  pseudo: string;
  email: string;
  telephone: string;
  matricule: string;
  photo: string | null;
  accountType: string;
}

export async function getProfile(): Promise<ActionResult<UserProfile>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Non authentifie." };

    await connectToDb();
    const user = await User.findById(session.userId)
      .select("pseudo email telephone matricule photo")
      .lean();
    if (!user) return { success: false, message: "Utilisateur introuvable." };

    return {
      success: true,
      message: "Profil charge.",
      data: {
        id: user._id.toString(),
        pseudo: user.pseudo,
        email: user.email,
        telephone: user.telephone,
        matricule: user.matricule,
        photo: user.photo ?? null,
        accountType: session.accountType,
      },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur profil." };
  }
}

export async function updateProfile(input: {
  pseudo?: string;
  telephone?: string;
  email?: string;
  photo?: string | null;
}): Promise<ActionResult<null>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Non authentifie." };

    await connectToDb();
    const update: any = {};
    if (input.pseudo && input.pseudo.trim().length >= 2) {
      update.pseudo = input.pseudo.trim();
    }
    if (input.telephone && input.telephone.trim().length >= 8) {
      update.telephone = input.telephone.trim();
    }
    if (input.email && input.email.trim().includes("@")) {
      update.email = input.email.trim().toLowerCase();
    }
    if (input.photo !== undefined) {
      update.photo = input.photo || null;
    }

    if (Object.keys(update).length === 0) {
      return { success: false, message: "Aucune modification." };
    }

    await User.updateOne({ _id: session.userId }, { $set: update });
    revalidatePath("/profile");

    return { success: true, message: "Profil mis a jour.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur mise a jour." };
  }
}
