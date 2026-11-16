"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/server/actions/public";
import type { FormState } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { BotProtection, ConsentCheckbox, FormAlert, SubmitButton, TextArea, TextField } from "./fields";

export function RegisterForm({ eventId, maxSeats, waitlist }: { eventId: string; maxSeats: number; waitlist: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(registerAction.bind(null, eventId), { ok: false });
  const partyOptions = Array.from({ length: Math.max(1, maxSeats) }, (_, i) => i + 1);
  const partyVal = typeof state.values?.seats === "string" ? state.values.seats : "1";

  return (
    <form action={action} className="relative space-y-6" noValidate>
      <FormAlert state={state} />
      {waitlist && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This event is currently full. Register to join the <strong>waitlist</strong> — we&apos;ll email you automatically if a place opens up.
        </p>
      )}

      <fieldset key={partyVal}>
        <legend className="field-label">How many people are coming (including you)?</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {partyOptions.map((n) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name="seats" value={n} defaultChecked={String(n) === partyVal} className="peer sr-only" aria-label={`${n} ${n === 1 ? "person" : "people"}`} />
              <span
                className={cn(
                  "grid h-12 min-w-12 place-items-center rounded-xl border border-line bg-white px-3 text-base font-semibold text-ink transition-all duration-200",
                  "hover:border-brand-300 hover:bg-brand-50 peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white peer-checked:shadow-[0_8px_20px_-10px_rgb(31_63_174/0.8)]",
                  "peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100 active:scale-95",
                )}
              >
                {n}
              </span>
            </label>
          ))}
        </div>
        {state.errors?.seats && <p className="field-error">{state.errors.seats}</p>}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="name" label="Full name" required autoComplete="name" state={state} />
        <TextField name="phone" type="tel" label="Mobile number" required autoComplete="tel" inputMode="tel" state={state} />
        <TextField name="email" type="email" label="Email" required autoComplete="email" inputMode="email" state={state} hint="Your confirmation and QR ticket will be sent here." className="sm:col-span-2" />
      </div>
      <TextArea name="notes" label="Notes (optional)" rows={3} maxLength={1000} placeholder="Names of others in your group, accessibility needs, etc." state={state} />
      <ConsentCheckbox state={state}>
        I agree that The Ark Victory Church may store my details to manage this registration, as described in the{" "}
        <Link href="/privacy" className="underline">privacy notice</Link>. For attendees under 18, I confirm I am their parent or guardian.
      </ConsentCheckbox>
      <BotProtection />
      <SubmitButton pendingText="Registering…">{waitlist ? "Join the waitlist" : "Confirm registration"}</SubmitButton>
    </form>
  );
}
