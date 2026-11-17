"use client";

import { useActionState, useState } from "react";
import type { Announcement } from "@prisma/client";
import { saveAnnouncementAction } from "@/server/actions/admin";
import type { FormState } from "@/lib/validation";
import { toIstLocalInput } from "@/lib/time";
import { FormAlert, SubmitButton, TextField } from "@/components/forms/fields";

export function AnnouncementForm({ a }: { a?: Announcement }) {
  const [state, action] = useActionState<FormState, FormData>(saveAnnouncementAction.bind(null, a?.id ?? null), { ok: false });
  const v = (k: string, f = "") => (typeof state.values?.[k] === "string" ? (state.values[k] as string) : f);
  // "Hide after" can't be earlier than "Show from": the picker greys out earlier dates.
  const [showFrom, setShowFrom] = useState(v("startsAt", toIstLocalInput(a?.startsAt)));
  return (
    <form
      action={action}
      className="space-y-6"
      noValidate
      onChange={(e) => {
        const t = e.target as unknown as HTMLInputElement;
        if (t.name === "startsAt") setShowFrom(t.value);
      }}
      onFocus={(e) => {
        // With no "Show from", the announcement starts now — so "Hide after" must be in the future.
        const t = e.target as unknown as HTMLInputElement;
        if (t.name === "endsAt") t.min = showFrom || toIstLocalInput(new Date());
      }}
    >
      <FormAlert state={state} />
      <section className="grid gap-5 rounded-2xl border border-line bg-white p-6 md:grid-cols-2">
        <TextField name="title" label="Title" required defaultValue={v("title", a?.title)} state={state} className="md:col-span-2" hint="e.g. “Christmas service at 10 AM — one combined service”" />
        <TextField name="body" label="Details (optional)" defaultValue={v("body", a?.body ?? "")} state={state} className="md:col-span-2" maxLength={400} />
        <TextField name="linkUrl" label="Link (optional)" defaultValue={v("linkUrl", a?.linkUrl ?? "")} state={state} placeholder="/events/christmas or https://…" />
        <TextField name="linkLabel" label="Link label" defaultValue={v("linkLabel", a?.linkLabel ?? "")} state={state} placeholder="Register" />
        <TextField name="startsAt" type="datetime-local" label="Show from (IST)" defaultValue={v("startsAt", toIstLocalInput(a?.startsAt))} state={state} hint="Leave empty to show immediately." />
        <TextField name="endsAt" type="datetime-local" label="Hide after (IST)" min={showFrom} defaultValue={v("endsAt", toIstLocalInput(a?.endsAt))} state={state} hint="Optional. Must be after “Show from”." />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={a ? a.active : true} className="h-4 w-4 accent-brand-600" /> Active (shown on the home page)</label>
      </section>
      <SubmitButton pendingText="Saving…">{a ? "Save" : "Publish announcement"}</SubmitButton>
    </form>
  );
}
