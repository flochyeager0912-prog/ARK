"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FocusEvent, type FormEvent } from "react";
import type { Event } from "@prisma/client";
import { saveEventAction } from "@/server/actions/admin";
import type { FormState } from "@/lib/validation";
import { parseIstLocal, toIstLocalInput } from "@/lib/time";
import type { EventAvailability } from "@/lib/events";
import { EventCard } from "@/components/site/event-card";
import { FormAlert, TextArea, TextField } from "@/components/forms/fields";
import { ImageField } from "@/components/admin/content/image-picker";


function Check({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-brand-600" />
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function EventForm({ event, ministries }: { event?: Event; ministries: { slug: string; name: string }[] }) {
  const [serverState, action, pending] = useActionState<FormState, FormData>(saveEventAction.bind(null, event?.id ?? null), { ok: false });
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const hasClientErrors = Object.keys(clientErrors).length > 0;
  const state: FormState = hasClientErrors
    ? { ...serverState, ok: false, message: "Please fix the highlighted fields.", errors: { ...serverState.errors, ...clientErrors } }
    : serverState;
  const failed = !state.ok && !!(state.message || Object.keys(state.errors ?? {}).length);
  const v = (k: string, fallback = "") => (typeof state.values?.[k] === "string" ? (state.values[k] as string) : fallback);
  const [image, setImage] = useState(event?.imageUrl ?? "");
  const [status, setStatus] = useState(event?.status ?? "DRAFT");
  const [draft, setDraft] = useState(() => ({
    title: event?.title ?? "",
    summary: event?.summary ?? "",
    venue: event?.venue ?? "The Ark Victory Church, Sembakkam",
    startsAt: toIstLocalInput(event?.startsAt),
    registrationEnabled: event ? event.registrationEnabled : true,
    ministrySlug: event?.ministrySlug ?? "",
  }));
  const readForm = (form: HTMLFormElement, changed?: string) => {
    const fd = new FormData(form);
    const startsAt = String(fd.get("startsAt") ?? "");
    setDraft({
      title: String(fd.get("title") ?? ""),
      summary: String(fd.get("summary") ?? ""),
      venue: String(fd.get("venue") ?? ""),
      startsAt,
      registrationEnabled: fd.get("registrationEnabled") === "on",
      ministrySlug: String(fd.get("ministrySlug") ?? ""),
    });
    // Moving the start can invalidate an end / closing time picked earlier: clear it and say why,
    // rather than letting an impossible range reach the server.
    if (changed === "startsAt") {
      const start = parseIstLocal(startsAt);
      const clear = (name: "endsAt" | "registrationClosesAt", bad: (d: Date) => boolean, message: string) => {
        const input = form.elements.namedItem(name) as HTMLInputElement | null;
        const d = input?.value ? parseIstLocal(input.value) : null;
        if (input && start && d && bad(d)) {
          input.value = "";
          setClientErrors((e) => ({ ...e, [name]: message }));
        }
      };
      clear("endsAt", (d) => d <= start!, "The end was before the new start — choose the end again.");
      clear("registrationClosesAt", (d) => d > start!, "Registration closed after the new start — choose again or leave empty.");
    }
  };

  /** Same rules as the server, checked before submitting so mistakes are caught immediately. */
  const validateRanges = (form: HTMLFormElement): Record<string, string> => {
    const get = (n: string) => String((form.elements.namedItem(n) as HTMLInputElement | null)?.value ?? "");
    const errs: Record<string, string> = {};
    const start = parseIstLocal(get("startsAt"));
    const end = get("endsAt") ? parseIstLocal(get("endsAt")) : null;
    const closes = get("registrationClosesAt") ? parseIstLocal(get("registrationClosesAt")) : null;
    if (!event && start && start.getTime() < Date.now()) errs.startsAt = "A new event must start in the future";
    if (start && end && end <= start) errs.endsAt = "End must be after the start";
    if (start && closes && closes > start) errs.registrationClosesAt = "Registration must close before the event starts";
    const capacity = Number(get("capacity"));
    const maxSeats = Number(get("maxSeatsPerBooking"));
    if (get("capacity") && Number.isInteger(capacity) && capacity > 0 && maxSeats > capacity)
      errs.maxSeatsPerBooking = `Can't be more than the capacity (${capacity})`;
    return errs;
  };

  /** Date pickers: never offer past start times for a new event. Set on focus so "now" is always current. */
  const onFocusField = (e: FocusEvent<HTMLFormElement>) => {
    const t = e.target as unknown as HTMLInputElement;
    if (!event && t.name === "startsAt") t.min = toIstLocalInput(new Date());
  };

  // Bring the first problem into view — the Create button sits at the bottom, far from the fields.
  const showFirstError = () => {
    const form = formRef.current;
    if (!form) return;
    const target = form.querySelector<HTMLElement>('[aria-invalid="true"]') ?? form.querySelector<HTMLElement>('[role="alert"]');
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (target?.matches("input, select, textarea")) target.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (!serverState.ok && (serverState.message || serverState.errors)) showFirstError();
  }, [serverState]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    // A date picked without a time (or a half-typed one) is submitted by the browser as empty.
    const partial: Record<string, string> = {};
    form.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]').forEach((el) => {
      if (el.validity.badInput) partial[el.name] = "Enter both a date and a time";
    });
    Object.assign(partial, validateRanges(form), partial);
    setClientErrors(partial);
    if (Object.keys(partial).length) {
      requestAnimationFrame(showFirstError);
      return;
    }
    // Dispatch directly instead of via the form `action` prop: React resets a form after an action
    // submission, which silently reverted the ministry, checkboxes and status after a rejected save.
    const fd = new FormData(form);
    startTransition(() => action(fd));
  };
  const clearClientError = (name: string) => {
    if (clientErrors[name]) setClientErrors(({ [name]: _gone, ...rest }) => rest); // eslint-disable-line @typescript-eslint/no-unused-vars
  };

  const previewAvailability: EventAvailability = status === "CANCELLED" ? "cancelled" : draft.registrationEnabled ? "open" : "dropin";

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
    <form
      ref={formRef}
      onSubmit={submit}
      onChange={(e) => {
        const name = (e.target as unknown as HTMLInputElement).name;
        clearClientError(name);
        readForm(e.currentTarget, name);
      }}
      onFocus={onFocusField}
      className="space-y-6"
      noValidate
    >
      <FormAlert state={state} />
      <section className="grid gap-5 rounded-2xl border border-line bg-white p-6 md:grid-cols-2">
        <TextField name="title" label="Title" required defaultValue={v("title", event?.title)} state={state} className="md:col-span-2" />
        <TextField name="slug" label="URL slug" defaultValue={v("slug", event?.slug)} state={state} hint="Leave blank to generate from the title. Appears as /events/your-slug." />
        <div>
          <label className="field-label" htmlFor="f-ministrySlug">Ministry</label>
          <select id="f-ministrySlug" name="ministrySlug" defaultValue={v("ministrySlug", event?.ministrySlug ?? "")} className="field">
            <option value="">— Whole church —</option>
            {ministries.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
          </select>
        </div>
        <TextField name="summary" label="Short summary" required defaultValue={v("summary", event?.summary)} state={state} className="md:col-span-2" maxLength={300} hint="One or two sentences shown on event cards and in search results." />
        <TextArea name="description" label="Full description" required rows={8} maxLength={10000} defaultValue={v("description", event?.description)} state={state} className="md:col-span-2" />
      </section>

      <section className="grid gap-5 rounded-2xl border border-line bg-white p-6 md:grid-cols-2">
        <TextField name="startsAt" type="datetime-local" label="Starts (IST)" required defaultValue={v("startsAt", toIstLocalInput(event?.startsAt))} state={state} />
        <TextField name="endsAt" type="datetime-local" label="Ends (IST)" min={draft.startsAt} defaultValue={v("endsAt", toIstLocalInput(event?.endsAt))} state={state} hint="Optional. Must be after the start." />
        <TextField name="venue" label="Venue" required defaultValue={v("venue", event?.venue ?? "The Ark Victory Church, Sembakkam")} state={state} className="md:col-span-2" />
        <div className="md:col-span-2">
          <span className="field-label">Image</span>
          <input type="hidden" name="imageUrl" value={image} />
          <ImageField value={image} onChange={setImage} />
          {state.errors?.imageUrl && <p className="field-error">{state.errors.imageUrl}</p>}
        </div>
      </section>

      <section className="grid gap-5 rounded-2xl border border-line bg-white p-6 md:grid-cols-2">
        <div className="space-y-4 md:col-span-2">
          <Check name="registrationEnabled" label="Require registration" defaultChecked={event ? event.registrationEnabled : true} hint="Untick for drop-in events — the page will say “No registration needed”." />
          <Check name="waitlistEnabled" label="Enable waitlist when full" defaultChecked={event ? event.waitlistEnabled : true} hint="Waitlisted people are confirmed automatically (first come, first served) when seats free up." />
        </div>
        <TextField name="capacity" type="number" inputMode="numeric" min="1" label="Capacity (seats)" defaultValue={v("capacity", event?.capacity?.toString() ?? "")} state={state} hint="Leave empty for unlimited." />
        <TextField name="maxSeatsPerBooking" type="number" inputMode="numeric" min="1" max="20" label="Max seats per booking" required defaultValue={v("maxSeatsPerBooking", String(event?.maxSeatsPerBooking ?? 5))} state={state} />
        <TextField name="registrationClosesAt" type="datetime-local" label="Registration closes (IST)" max={draft.startsAt} defaultValue={v("registrationClosesAt", toIstLocalInput(event?.registrationClosesAt))} state={state} hint="Optional. Defaults to the event start time; can't be after it." />
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <label className="field-label" htmlFor="f-status">Status</label>
        <select id="f-status" name="status" value={status} onChange={(e) => setStatus(e.target.value as Event["status"])} className="field max-w-xs">
          <option value="DRAFT">Draft — not visible to the public</option>
          <option value="PUBLISHED">Published</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        {status === "CANCELLED" && event?.status !== "CANCELLED" && (
          <div className="mt-4">
            <Check name="notifyCancellation" label="Email everyone registered that the event is cancelled" defaultChecked />
          </div>
        )}
      </section>

      <div className="sticky bottom-0 z-10 -mx-1 flex items-center gap-3 rounded-2xl border border-line bg-white/95 p-3 shadow-card backdrop-blur">
        <button type="submit" disabled={pending} aria-disabled={pending} className="btn-primary w-full sm:w-auto">
          {pending ? "Saving…" : event ? "Save changes" : "Create event"}
        </button>
        {failed && !pending ? (
          <button type="button" onClick={showFirstError} className="text-left text-xs font-medium text-red-700 hover:underline">
            Not saved yet — {state.errors && Object.keys(state.errors).length ? "fix the highlighted fields above" : state.message}
          </button>
        ) : (
          <p className="text-xs text-muted">
            {status === "PUBLISHED" ? "Saving updates the public site immediately." : status === "DRAFT" ? "Drafts are hidden from the public site." : "The public page will show this event as cancelled."}
          </p>
        )}
      </div>
    </form>

    <aside className="space-y-3 xl:sticky xl:top-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Live preview</p>
      <div className="pointer-events-none" aria-hidden>
        <EventCard
          event={{
            slug: "preview",
            title: draft.title || "Event title",
            summary: draft.summary || "Your short summary appears here.",
            venue: draft.venue || "Venue",
            imageUrl: image || null,
            startsAt: parseIstLocal(draft.startsAt) ?? new Date(),
            status,
            availability: previewAvailability,
          }}
          tag={ministries.find((m) => m.slug === draft.ministrySlug)?.name}
        />
      </div>
      <p className="text-xs text-muted">
        {status === "DRAFT" ? "Not visible yet — set the status to Published to show it on /events." : "This is how the card looks on the home page and /events."}
      </p>
    </aside>
    </div>
  );
}

