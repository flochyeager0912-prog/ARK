/**
 * Session JWT sign/verify. Edge-compatible (used by proxy.ts and server code).
 */
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "ark_admin_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export type SessionClaims = { sub: string; role: "ADMIN" | "EDITOR"; name: string; email: string };

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET is missing or too short");
  return new TextEncoder().encode(secret);
}

export async function signSession(claims: SessionClaims) {
  return new SignJWT({ role: claims.role, name: claims.name, email: claims.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setIssuer("ark-web")
    .setAudience("ark-admin")
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), {
      algorithms: ["HS256"],
      issuer: "ark-web",
      audience: "ark-admin",
    });
    if (!payload.sub || (payload.role !== "ADMIN" && payload.role !== "EDITOR")) return null;
    return {
      sub: payload.sub,
      role: payload.role,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
    };
  } catch {
    return null;
  }
}
