"use client";

import { useActionState } from "react";
import { loginAction } from "@/server/actions/admin";
import type { FormState } from "@/lib/validation";
import { FormAlert, SubmitButton, TextField } from "@/components/forms/fields";

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(loginAction, { ok: false });
  return (
    <form action={action} className="mt-6 space-y-4">
      <FormAlert state={state} />
      <TextField name="email" type="email" label="Email" autoComplete="username" required state={state} />
      <TextField name="password" type="password" label="Password" autoComplete="current-password" required />
      <SubmitButton className="w-full sm:w-full" pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
