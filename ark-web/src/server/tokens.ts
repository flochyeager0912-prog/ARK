import "server-only";
import { createHash, randomBytes, randomInt } from "node:crypto";

/** 32-byte URL-safe random token (256 bits). */
export const newToken = () => randomBytes(32).toString("base64url");

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

// Unambiguous alphabet (no 0/O, 1/I/L)
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export function newRefCode(prefix = "ARK") {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `${prefix}-${s}`;
}
