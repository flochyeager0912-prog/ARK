"use client";

import { useActionState } from "react";
import { changePasswordAction, createUserAction } from "@/server/actions/admin";
import type { FormState } from "@/lib/validation";
import { FormAlert, SubmitButton, TextField } from "@/components/forms/fields";

export function CreateUserForm() {
  const [state, action] = useActionState<FormState, FormData>(createUserAction, { ok: false });
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2" noValidate>
      <div className="md:col-span-2"><FormAlert state={state} /></div>
      <TextField name="name" label="Name" required state={state} />
      <TextField name="email" type="email" label="Email" required state={state} />
      <div>
        <label className="field-label" htmlFor="role">Role</label>
        <select id="role" name="role" defaultValue="EDITOR" className="field">
          <option value="EDITOR">Editor — events, inboxes, content</option>
          <option value="ADMIN">Admin — everything incl. users</option>
        </select>
      </div>
      <TextField name="password" type="password" label="Temporary password" required state={state} autoComplete="new-password" hint="12+ characters with upper, lower case and a number." />
      <div className="md:col-span-2"><SubmitButton pendingText="Creating…">Create user</SubmitButton></div>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePasswordAction, { ok: false });
  return (
    <form action={action} className="max-w-md space-y-4" noValidate>
      <FormAlert state={state} />
      <TextField name="current" type="password" label="Current password" required state={state} autoComplete="current-password" />
      <TextField name="next" type="password" label="New password" required state={state} autoComplete="new-password" hint="12+ characters with upper, lower case and a number." />
      <TextField name="confirm" type="password" label="Confirm new password" required state={state} autoComplete="new-password" />
      <SubmitButton pendingText="Updating…">Update password</SubmitButton>
    </form>
  );
}
