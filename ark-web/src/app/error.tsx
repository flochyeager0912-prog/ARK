"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex min-h-screen items-center bg-[radial-gradient(900px_600px_at_70%_20%,rgb(76_98_196/0.25),transparent_65%),linear-gradient(180deg,#050812,#03050c)] text-white">
      <div className="mx-auto max-w-lg px-6 text-center">
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-white/75">Please try again. If the problem continues, call us on +91 98842 65131.</p>
        {error.digest && <p className="mt-2 text-xs text-white/50">Reference: {error.digest}</p>}
        <button onClick={reset} className="btn-light mt-6">Try again</button>
        <Link href="/" className="btn-ghost-light ml-3 mt-6">Home</Link>
      </div>
    </main>
  );
}
