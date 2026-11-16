"use client";

import { useActionState, useTransition } from "react";
import { adminCancelRegistrationAction, checkInByRefAction, toggleCheckInAction } from "@/server/actions/admin";
import type { FormState } from "@/lib/validation";
import { FormAlert } from "@/components/forms/fields";

export function CheckInBox({ eventId }: { eventId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(checkInByRefAction.bind(null, eventId), { ok: false });
  return (
    <form
      action={action}
      className="space-y-3"
      onSubmit={(e) => {
        // Clear the field after submit so the next QR scan can be entered straight away.
        const f = e.currentTarget;
        setTimeout(() => {
          const input = f.elements.namedItem("ref") as HTMLInputElement | null;
          if (input) { input.value = ""; input.focus(); }
        }, 0);
      }}
    >
      <label htmlFor="ref" className="field-label">Booking reference</label>
      <div className="flex gap-2">
        <input id="ref" name="ref" autoFocus autoComplete="off" autoCapitalize="characters" placeholder="ARK-XXXXXX — type or scan the QR" className="field max-w-sm font-mono uppercase" />
        <button className="btn-primary" disabled={pending}>{pending ? "…" : "Check in"}</button>
      </div>
      <p className="text-xs text-muted">Tip: a USB/Bluetooth QR scanner or the phone camera&apos;s QR reader types the reference straight into this box.</p>
      <FormAlert state={state} />
    </form>
  );
}

export function RegistrationRowActions({ id, eventId, status, checkedIn }: { id: string; eventId: string; status: string; checkedIn: boolean }) {
  const [pending, start] = useTransition();
  if (status === "CANCELLED") return null;
  return (
    <div className="flex justify-end gap-2">
      {status === "CONFIRMED" && (
        <button
          disabled={pending}
          onClick={() => start(() => toggleCheckInAction(id, eventId, !checkedIn))}
          className={checkedIn ? "btn-outline px-3 py-1.5 text-xs" : "btn-primary px-3 py-1.5 text-xs"}
        >
          {checkedIn ? "Undo check-in" : "Check in"}
        </button>
      )}
      <button
        disabled={pending}
        onClick={() => {
          if (confirm("Cancel this registration? The person will NOT be emailed automatically; waitlisted people will be promoted.")) {
            start(() => adminCancelRegistrationAction(id, eventId));
          }
        }}
        className="btn-outline px-3 py-1.5 text-xs text-red-600"
      >
        Cancel
      </button>
    </div>
  );
}
