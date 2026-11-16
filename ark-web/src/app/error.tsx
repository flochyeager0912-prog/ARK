"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="hero-bg flex min-h-screen items-center text-white">
      <div className="mx-auto max-w-lg px-6 text-center">
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-white/75">Please try again. If the problem continues, call us on +91 98842 65131.</p>
        {error.digest && <p className="mt-2 text-xs text-white/50">Reference: {error.digest}</p>}
        <button onClick={reset} className="btn-light mt-6">Try again</button>
      </div>
    </main>
  );
}
