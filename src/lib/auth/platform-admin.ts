import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminMagicLink from "@/lib/models/AdminMagicLink";
import { getSessionSecret } from "@/lib/auth/session";
import { appOrigin } from "@/lib/utils/app-url";
import connectToDb from "@/lib/utils/db";

/*
 * Administrateur de la plateforme ELMES (et non d'un tenant).
 * Pas de mot de passe : accès par lien magique envoyé aux adresses ADMIN_EMAIL.
 */

const ADMIN_COOKIE = "elmes_platform_admin";
const ADMIN_SESSION_SECONDS = 60 * 60 * 8;

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return adminEmails().includes(email.trim().toLowerCase());
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(`platform-admin:${value}`).digest("base64url");
}

/** Crée un lien à usage unique vers le dashboard plateforme. */
export async function createAdminMagicLink(email: string, ttlMinutes = 30): Promise<string> {
  await connectToDb();
  const token = crypto.randomBytes(32).toString("base64url");
  await AdminMagicLink.create({
    tokenHash: hashToken(token),
    email: email.trim().toLowerCase(),
    expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
  });
  const url = new URL("/platform/auth", await appOrigin());
  url.searchParams.set("token", token);
  return url.toString();
}

/** Consomme le lien (une seule fois) et ouvre la session admin. */
export async function consumeAdminMagicLink(token: string): Promise<boolean> {
  if (!token) return false;
  await connectToDb();
  const link = await AdminMagicLink.findOneAndUpdate(
    { tokenHash: hashToken(token), usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { new: true }
  ).lean();
  if (!link || !isAdminEmail(link.email)) return false;

  const expiresAt = Date.now() + ADMIN_SESSION_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ email: link.email, expiresAt })).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  });
  return true;
}

export async function getPlatformAdmin(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const supplied = Buffer.from(signature);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email: string; expiresAt: number };
    if (data.expiresAt <= Date.now() || !isAdminEmail(data.email)) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

export async function requirePlatformAdmin(): Promise<{ email: string }> {
  const admin = await getPlatformAdmin();
  if (!admin) redirect("/platform/login");
  return admin;
}

export async function clearPlatformAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
