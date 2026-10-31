import { type NextRequest } from "next/server";
import crypto from "node:crypto";
import { verifySession, type SessionPayload } from "@/lib/auth/session";

export function verifyAgentKey(request: NextRequest): boolean {
  const key = request.headers.get("x-agent-key");
  const secret = process.env.CLAUDE_AGENT_SECRET;
  if (!secret || !key) return false;
  const supplied = Buffer.from(key);
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

export function getAgentSession(request: NextRequest): SessionPayload | null {
  const token = request.headers.get("x-agent-token");
  if (!token) return null;
  return verifySession(token);
}
