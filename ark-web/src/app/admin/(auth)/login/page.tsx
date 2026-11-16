import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdmin } from "@/server/auth";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Staff sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="hero-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Image src="/images/logo-white.webp" alt="The Ark Victory Church" width={160} height={86} className="mx-auto mb-8 h-16 w-auto" priority />
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <h1 className="text-2xl font-semibold">Staff sign in</h1>
          <p className="mt-1 text-sm text-muted">For church office and ministry leaders.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
