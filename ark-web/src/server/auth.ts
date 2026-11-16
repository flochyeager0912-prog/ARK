import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { rateLimit } from "./rate-limit";
import { audit } from "./audit";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "@/lib/session-token";
import { env } from "@/lib/env";

/**
 * Should the session cookie carry the `Secure` flag?
 * Yes whenever the request reached us over HTTPS (directly or via a proxy that sets
 * X-Forwarded-Proto). On plain HTTP (local testing via an IP address) a Secure cookie would be
 * silently dropped by the browser and login would loop back to the sign-in page.
 */
async function shouldUseSecureCookie() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (proto) return proto === "https";
  return env().SITE_URL.startsWith("https://");
}

export type AdminSession = { id: string; name: string; email: string; role: "ADMIN" | "EDITOR" };

const BCRYPT_COST = 12;
// Pre-computed hash used to keep timing constant when the email doesn't exist.
const DUMMY_HASH = "$2b$12$HAxxYufU7PDKzKqvlIBi.eJ9v7iEuj/d8.yKNBYQnYP1dzCDxWMq2";

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_COST);

export function validatePasswordStrength(pw: string): string | null {
  if (pw.length < 12) return "Password must be at least 12 characters.";
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw)) return "Use upper and lower case letters and a number.";
  return null;
}

export async function login(email: string, password: string, ip: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const normalized = email.trim().toLowerCase();
  const allowedIp = await rateLimit(`login-ip:${ip}`, 20, 15 * 60);
  const allowedAcct = await rateLimit(`login-acct:${normalized}`, 5, 15 * 60);
  if (!allowedIp || !allowedAcct) {
    return { ok: false, message: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }

  const user = await db.adminUser.findUnique({ where: { email: normalized } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid || !user.active) {
    await audit(null, "auth.login_failed", "admin_user", user?.id, { email: normalized, ip });
    return { ok: false, message: "Incorrect email or password." };
  }

  const token = await signSession({ sub: user.id, role: user.role, name: user.name, email: user.email });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: await shouldUseSecureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await audit(user.id, "auth.login", "admin_user", user.id, { ip });
  return { ok: true };
}

export async function logout() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, secure: await shouldUseSecureCookie(), sameSite: "lax", path: "/", maxAge: 0 });
}

/** Returns the current admin (re-validated against the DB) or null. */
export async function getAdmin(): Promise<AdminSession | null> {
  const jar = await cookies();
  const claims = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!claims) return null;
  const user = await db.adminUser.findUnique({
    where: { id: claims.sub },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  if (!user || !user.active) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin(role?: "ADMIN"): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (role === "ADMIN" && admin.role !== "ADMIN") redirect("/admin?error=forbidden");
  return admin;
}
