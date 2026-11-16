"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitVolunteerAction } from "@/server/actions/public";
import { AVAILABILITY, VOLUNTEER_TEAMS, type FormState } from "@/lib/validation";
import { BotProtection, CheckboxGroup, ConsentCheckbox, FormAlert, SubmitButton, TextArea, TextField } from "./fields";

export function VolunteerForm() {
  const [state, action] = useActionState<FormState, FormData>(submitVolunteerAction, { ok: false });

  if (state.ok) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-6 text-emerald-900" role="status">
        <h3 className="text-xl font-semibold">Thank you for offering to serve! 🙌</h3>
        <p className="mt-2">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="relative space-y-6" noValidate>
      <FormAlert state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="name" label="Full name" required autoComplete="name" state={state} />
        <TextField name="phone" type="tel" label="Mobile number" required autoComplete="tel" inputMode="tel" state={state} />
        <TextField name="email" type="email" label="Email" required autoComplete="email" inputMode="email" state={state} className="sm:col-span-2" />
      </div>
      <CheckboxGroup name="teams" label="Which teams would you like to serve in?" required options={VOLUNTEER_TEAMS} state={state} />
      <CheckboxGroup name="availability" label="When are you usually available?" options={AVAILABILITY} state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="attendingSince" label="How long have you attended The Ark?" placeholder="e.g. 2 years / new" state={state} maxLength={60} />
      </div>
      <TextArea name="experience" label="Skills or previous experience" rows={3} maxLength={2000} state={state} />
      <TextArea name="message" label="Anything else you'd like us to know?" rows={3} maxLength={2000} state={state} />
      <p className="rounded-xl bg-surface px-4 py-3 text-sm text-muted">
        Volunteers serving with children and youth may be asked for a reference and a short conversation with a ministry leader.
      </p>
      <ConsentCheckbox state={state}>
        I agree that The Ark Victory Church may store my details to process my volunteer application, as described in the{" "}
        <Link href="/privacy" className="underline">privacy notice</Link>.
      </ConsentCheckbox>
      <BotProtection />
      <SubmitButton pendingText="Submitting…">Submit application</SubmitButton>
    </form>
  );
}
