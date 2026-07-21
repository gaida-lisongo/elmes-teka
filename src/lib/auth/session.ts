import crypto from "node:crypto";
import { cookies } from "next/headers";

export type AccountType = "TENANT" | "SALER";

export interface SessionPayload {
  userId: string;
  accountType: AccountType;
  tenantId?: string;
  salerId?: string;
  storeId?: string;
  issuedAt: number;
  expiresAt: number;
}

const SESSION_COOKIE_NAME = "commerce_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SESSION_SECRET doit contenir au moins 32 caracteres.");
  }

  return secret;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function signSession(payload: SessionPayload): string {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const [encodedPayload, suppliedSignature] = token.split(".");

    if (!encodedPayload || !suppliedSignature) {
      return null;
    }

    const expectedSignature = crypto
      .createHmac("sha256", getSessionSecret())
      .update(encodedPayload)
      .digest("base64url");

    const suppliedBuffer = Buffer.from(suppliedSignature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (suppliedBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) {
      return null;
    }

    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SessionPayload;

    if (
      !payload.userId ||
      !payload.accountType ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function createSessionCookie(
  payload: Omit<SessionPayload, "issuedAt" | "expiresAt">
): Promise<void> {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_DURATION_SECONDS * 1000;
  const token = signSession({ ...payload, issuedAt, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
