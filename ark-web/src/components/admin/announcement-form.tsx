"use client";

import { useActionState } from "react";
import type { Announcement } from "@prisma/client";
import { saveAnnouncementAction } from "@/server/actions/admin";
import type { FormState } from "@/lib/validation";
import { toIstLocalInput } from "@/lib/time";
import { FormAlert, SubmitButton, TextField } from "@/components/forms/fields";

export function AnnouncementForm({ a }: { a?: Announcement }) {
  const [state, action] = useActionState<FormState, FormData>(saveAnnouncementAction.bind(null, a?.id ?? null), { ok: false });
  const v = (k: string, f = "") => (typeof state.values?.[k] === "string" ? (state.values[k] as string) : f);
  return (
    <form action={action} className="space-y-6" noValidate>
      <FormAlert state={state} />
      <section className="grid gap-5 rounded-2xl border border-line bg-white p-6 md:grid-cols-2">
        <TextField name="title" label="Title" required defaultValue={v("title", a?.title)} state={state} className="md:col-span-2" hint="e.g. “Christmas service at 10 AM — one combined service”" />
        <TextField name="body" label="Details (optional)" defaultValue={v("body", a?.body ?? "")} state={state} className="md:col-span-2" maxLength={400} />
        <TextField name="linkUrl" label="Link (optional)" defaultValue={v("linkUrl", a?.linkUrl ?? "")} state={state} placeholder="/events/christmas or https://…" />
        <TextField name="linkLabel" label="Link label" defaultValue={v("linkLabel", a?.linkLabel ?? "")} state={state} placeholder="Register" />
        <TextField name="startsAt" type="datetime-local" label="Show from (IST)" defaultValue={v("startsAt", toIstLocalInput(a?.startsAt))} state={state} hint="Leave empty to show immediately." />
        <TextField name="endsAt" type="datetime-local" label="Hide after (IST)" defaultValue={v("endsAt", toIstLocalInput(a?.endsAt))} state={state} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={a ? a.active : true} className="h-4 w-4 accent-brand-600" /> Active</label>
      </section>
      <SubmitButton pendingText="Saving…">{a ? "Save" : "Publish announcement"}</SubmitButton>
    </form>
  );
}
