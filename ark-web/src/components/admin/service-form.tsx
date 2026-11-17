"use client";

import { useActionState, useState } from "react";
import type { Service } from "@prisma/client";
import { saveServiceAction } from "@/server/actions/admin";
import type { FormState } from "@/lib/validation";
import { WEEKDAYS } from "@/lib/time";
import { FormAlert, SubmitButton, TextArea, TextField } from "@/components/forms/fields";

export function ServiceForm({ service }: { service?: Service }) {
  const [state, action] = useActionState<FormState, FormData>(saveServiceAction.bind(null, service?.id ?? null), { ok: false });
  const v = (k: string, f = "") => (typeof state.values?.[k] === "string" ? (state.values[k] as string) : f);
  const [rec, setRec] = useState(v("recurrence", service?.recurrence ?? "WEEKLY"));
  // End time can't be before the start time: the picker enforces it, the server re-checks it.
  const [start, setStart] = useState(v("startTime", service?.startTime ?? ""));

  return (
    <form
      action={action}
      className="space-y-6"
      noValidate
      onChange={(e) => {
        const t = e.target as unknown as HTMLInputElement;
        if (t.name === "startTime") setStart(t.value);
      }}
    >
      <FormAlert state={state} />
      <section className="grid gap-5 rounded-2xl border border-line bg-white p-6 md:grid-cols-2">
        <TextField name="name" label="Name" required defaultValue={v("name", service?.name)} state={state} />
        <TextField name="subtitle" label="Subtitle" defaultValue={v("subtitle", service?.subtitle ?? "")} state={state} hint="e.g. “Youth service”" />
        <div>
          <label className="field-label" htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={v("category", service?.category ?? "SUNDAY")} className="field">
            <option value="SUNDAY">Sunday service</option>
            <option value="FELLOWSHIP">Language fellowship</option>
            <option value="CHILDREN">Children & youth</option>
            <option value="MONTHLY">Monthly gathering</option>
          </select>
        </div>
        <TextField name="language" label="Language" defaultValue={v("language", service?.language ?? "")} state={state} />
        <TextArea name="description" label="Description" rows={3} maxLength={1000} defaultValue={v("description", service?.description ?? "")} state={state} className="md:col-span-2" />
      </section>
      <section className="grid gap-5 rounded-2xl border border-line bg-white p-6 md:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="recurrence">Repeats</label>
          <select id="recurrence" name="recurrence" value={rec} onChange={(e) => setRec(e.target.value)} className="field">
            <option value="WEEKLY">Every week</option>
            <option value="MONTHLY_NTH">Monthly (nth weekday)</option>
          </select>
        </div>
        {rec === "MONTHLY_NTH" && (
          <div>
            <label className="field-label" htmlFor="nthWeek">Which week</label>
            <select id="nthWeek" name="nthWeek" defaultValue={v("nthWeek", String(service?.nthWeek ?? 1))} className="field">
              <option value="1">1st</option><option value="2">2nd</option><option value="3">3rd</option><option value="4">4th</option><option value="-1">Last</option>
            </select>
            {state.errors?.nthWeek && <p className="field-error">{state.errors.nthWeek}</p>}
          </div>
        )}
        <div>
          <label className="field-label" htmlFor="dayOfWeek">Day</label>
          <select id="dayOfWeek" name="dayOfWeek" defaultValue={v("dayOfWeek", String(service?.dayOfWeek ?? 0))} className="field">
            {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </div>
        <TextField name="startTime" type="time" label="Start time (IST)" defaultValue={v("startTime", service?.startTime ?? "")} state={state} hint="Leave empty if the time is to be announced." />
        <TextField name="endTime" type="time" label="End time" min={start} defaultValue={v("endTime", service?.endTime ?? "")} state={state} hint={start ? "Must be after the start time." : undefined} />
        <TextField name="venue" label="Venue / hall" defaultValue={v("venue", service?.venue ?? "")} state={state} />
        <TextField name="sortOrder" type="number" label="Display order" defaultValue={v("sortOrder", String(service?.sortOrder ?? 0))} state={state} />
        <TextField name="slug" label="Slug" defaultValue={v("slug", service?.slug ?? "")} state={state} hint="Used to link ministries to this time." />
      </section>
      <section className="flex flex-wrap gap-6 rounded-2xl border border-line bg-white p-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="livestream" defaultChecked={service?.livestream} className="h-4 w-4 accent-brand-600" /> Streamed live on YouTube</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={service ? service.active : true} className="h-4 w-4 accent-brand-600" /> Show on website</label>
      </section>
      <SubmitButton pendingText="Saving…">{service ? "Save changes" : "Add service"}</SubmitButton>
    </form>
  );
}
