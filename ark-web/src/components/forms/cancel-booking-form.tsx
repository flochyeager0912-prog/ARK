"use client";

import { useActionState } from "react";
import { cancelBookingAction } from "@/server/actions/public";
import type { FormState } from "@/lib/validation";
import { FormAlert, SubmitButton } from "./fields";

export function CancelBookingForm({ token }: { token: string }) {
  const [state, action] = useActionState<FormState, FormData>(cancelBookingAction.bind(null, token), { ok: false });
  if (state.ok) return <FormAlert state={state} />;
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Cancel this booking? Your seat(s) will be released.")) e.preventDefault();
      }}
      className="space-y-3"
    >
      <FormAlert state={state} />
      <SubmitButton className="btn-danger" pendingText="Cancelling…">Cancel my booking</SubmitButton>
    </form>
  );
}
