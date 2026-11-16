"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Submit button that shows a pending label while its server action runs. */
export function PendingButton({ className, pendingText = "…", children, title }: { className?: string; pendingText?: string; children: ReactNode; title?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={className} title={title}>
      {pending ? pendingText : children}
    </button>
  );
}
