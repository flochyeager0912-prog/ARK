"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitEnquiryAction } from "@/server/actions/public";
import { ENQUIRY_PURPOSES, type FormState } from "@/lib/validation";
import { BotProtection, ConsentCheckbox, FormAlert, SelectField, SubmitButton, TextArea, TextField } from "./fields";

export function ContactForm({ defaultPurpose, ministry, ministryName }: { defaultPurpose?: string; ministry?: string; ministryName?: string }) {
  const [state, action] = useActionState<FormState, FormData>(submitEnquiryAction, { ok: false });
  const initial = ENQUIRY_PURPOSES.some((p) => p.value === defaultPurpose) ? defaultPurpose : undefined;
  const [purpose, setPurpose] = useState(initial ?? "");

  if (state.ok) {
    return (
      <div className="tone-ok rounded-2xl p-6" role="status">
        <h3 className="text-xl font-semibold">Message received 🙏</h3>
        <p className="mt-2">{state.message}</p>
        <p className="mt-2 text-sm">We&apos;ve also sent a confirmation to your email.</p>
      </div>
    );
  }

  return (
    <form action={action} className="relative space-y-5" noValidate onChange={(e) => {
      const t = e.target;
      if (t instanceof HTMLSelectElement && t.name === "purpose") setPurpose(t.value);
    }}>
      <FormAlert state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="name" label="Your name" required autoComplete="name" state={state} maxLength={120} />
        <TextField name="email" type="email" label="Your email" required autoComplete="email" inputMode="email" state={state} />
        <TextField name="phone" type="tel" label="Phone" autoComplete="tel" inputMode="tel" placeholder="+91 98xxx xxxxx" state={state} />
        <SelectField name="purpose" label="Purpose" required options={ENQUIRY_PURPOSES} defaultValue={initial} state={state} />
      </div>
      {ministry && (
        <>
          <input type="hidden" name="ministry" value={ministry} />
          <p className="rounded-xl bg-accent-soft px-4 py-2 text-sm text-ink">Regarding: <strong>{ministryName ?? ministry}</strong></p>
        </>
      )}
      <TextArea
        name="message"
        label={purpose === "prayer-request" ? "Your prayer request" : "Your message"}
        required
        rows={6}
        state={state}
        hint={purpose === "prayer-request" ? "Prayer requests are confidential and only seen by our pastoral team." : undefined}
      />
      {purpose === "prayer-request" && (
        <label className="flex items-start gap-3 text-sm text-muted">
          <input type="checkbox" name="contactOk" defaultChecked className="mt-0.5 h-4 w-4 accent-accent" />
          A pastor may contact me about this request.
        </label>
      )}
      <ConsentCheckbox state={state}>
        I agree that The Ark Victory Church may store my details to respond to this message, as described in the{" "}
        <Link href="/privacy" className="underline">privacy notice</Link>.
      </ConsentCheckbox>
      <BotProtection />
      <SubmitButton>Send message</SubmitButton>
    </form>
  );
}
