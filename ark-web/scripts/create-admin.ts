/**
 * Create (or reset the password of) a staff user from the command line.
 *
 *   npm run admin:create -- --email someone@example.com --name "Name" [--role ADMIN|EDITOR]
 *
 * The password is read from the ARK_NEW_PASSWORD env var or prompted for (hidden).
 */
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "node:readline";

// Load .env when present (in containers the variables are injected directly).
if (fs.existsSync(".env")) process.loadEnvFile(".env");

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function promptHidden(q: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (rl as any)._writeToOutput = (s: string) => { if (s.includes(q)) process.stdout.write(s); };
    rl.question(q, (a) => { rl.close(); process.stdout.write("\n"); resolve(a); });
  });
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name") ?? "Church Office";
  const role = (arg("role") ?? "EDITOR").toUpperCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("--email is required");
  if (role !== "ADMIN" && role !== "EDITOR") throw new Error("--role must be ADMIN or EDITOR");
  const password = process.env.ARK_NEW_PASSWORD ?? (await promptHidden("Password (12+ chars, upper/lower/number): "));
  if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new Error("Password must be 12+ characters and include upper case, lower case and a number");
  }
  const db = new PrismaClient();
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.adminUser.upsert({
    where: { email },
    create: { email, name, role, passwordHash },
    update: { passwordHash, active: true },
  });
  console.log(`✔ ${user.email} (${user.role}) is ready.`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
