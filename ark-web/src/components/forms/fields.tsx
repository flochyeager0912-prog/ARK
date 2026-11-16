"use client";

import Script from "next/script";
import { useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/validation";
import { cn } from "@/lib/utils";

/** Hidden anti-bot inputs: honeypot + render timestamp + optional Turnstile widget. */
export function BotProtection() {
  // Records when the form was rendered in the browser; submissions faster than a human could type are dropped.
  const tsRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (tsRef.current) tsRef.current.value = String(Date.now());
  }, []);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  return (
    <>
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input ref={tsRef} type="hidden" name="_ts" defaultValue="" />
      {siteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={siteKey} data-theme="light" />
        </>
      )}
    </>
  );
}

export function SubmitButton({ children, pendingText = "Sending…", className }: { children: ReactNode; pendingText?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={cn(className?.includes("btn-") ? className : cn("btn-primary", className), "w-full sm:w-auto")}
    >
      {pending ? pendingText : children}
    </button>
  );
}

type BaseProps = {
  name: string;
  label: string;
  state?: FormState;
  hint?: string;
  required?: boolean;
  className?: string;
};

function val(state: FormState | undefined, name: string, fallback = "") {
  const v = state?.values?.[name];
  return typeof v === "string" ? v : fallback;
}

export function TextField({
  type = "text",
  autoComplete,
  placeholder,
  defaultValue,
  inputMode,
  maxLength,
  ...p
}: BaseProps & {
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  defaultValue?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  maxLength?: number;
}) {
  const err = p.state?.errors?.[p.name];
  const id = `f-${p.name}`;
  return (
    <div className={p.className}>
      <label htmlFor={id} className="field-label">
        {p.label} {p.required && <span className="text-red-600" aria-hidden>*</span>}
      </label>
      <input
        id={id}
        name={p.name}
        type={type}
        required={p.required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        key={val(p.state, p.name, defaultValue)}
        defaultValue={val(p.state, p.name, defaultValue)}
        aria-invalid={err ? true : undefined}
        aria-describedby={err ? `${id}-err` : p.hint ? `${id}-hint` : undefined}
        className="field"
      />
      {p.hint && !err && <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">{p.hint}</p>}
      {err && <p id={`${id}-err`} className="field-error">{err}</p>}
    </div>
  );
}

export function TextArea({
  rows = 5,
  maxLength = 4000,
  placeholder,
  defaultValue,
  ...p
}: BaseProps & { rows?: number; maxLength?: number; placeholder?: string; defaultValue?: string }) {
  const err = p.state?.errors?.[p.name];
  const id = `f-${p.name}`;
  return (
    <div className={p.className}>
      <label htmlFor={id} className="field-label">
        {p.label} {p.required && <span className="text-red-600" aria-hidden>*</span>}
      </label>
      <textarea
        id={id}
        name={p.name}
        rows={rows}
        required={p.required}
        maxLength={maxLength}
        placeholder={placeholder}
        key={val(p.state, p.name, defaultValue)}
        defaultValue={val(p.state, p.name, defaultValue)}
        aria-invalid={err ? true : undefined}
        aria-describedby={err ? `${id}-err` : undefined}
        className="field"
      />
      {p.hint && !err && <p className="mt-1.5 text-xs text-muted">{p.hint}</p>}
      {err && <p id={`${id}-err`} className="field-error">{err}</p>}
    </div>
  );
}

export function SelectField({
  options,
  defaultValue,
  ...p
}: BaseProps & { options: readonly { value: string; label: string }[]; defaultValue?: string }) {
  const err = p.state?.errors?.[p.name];
  const id = `f-${p.name}`;
  return (
    <div className={p.className}>
      <label htmlFor={id} className="field-label">
        {p.label} {p.required && <span className="text-red-600" aria-hidden>*</span>}
      </label>
      <select
        id={id}
        name={p.name}
        required={p.required}
        key={val(p.state, p.name, defaultValue)}
        defaultValue={val(p.state, p.name, defaultValue ?? "")}
        aria-invalid={err ? true : undefined}
        className="field"
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {err && <p className="field-error">{err}</p>}
    </div>
  );
}

export function CheckboxGroup({ options, ...p }: BaseProps & { options: readonly string[] }) {
  const err = p.state?.errors?.[p.name];
  const selected = p.state?.values?.[p.name];
  const chosen = Array.isArray(selected) ? selected : [];
  return (
    <fieldset className={p.className} aria-invalid={err ? true : undefined}>
      <legend className="field-label">
        {p.label} {p.required && <span className="text-red-600" aria-hidden>*</span>}
      </legend>
      {p.hint && <p className="-mt-1 mb-2 text-xs text-muted">{p.hint}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label key={o} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
            <input type="checkbox" name={p.name} value={o} defaultChecked={chosen.includes(o)} className="h-4 w-4 accent-brand-600" />
            {o}
          </label>
        ))}
      </div>
      {err && <p className="field-error">{err}</p>}
    </fieldset>
  );
}

export function ConsentCheckbox({ state, children }: { state?: FormState; children: ReactNode }) {
  const err = state?.errors?.consent;
  return (
    <div>
      <label className="flex items-start gap-3 text-sm text-muted">
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600" aria-invalid={err ? true : undefined} />
        <span>{children}</span>
      </label>
      {err && <p className="field-error">{err}</p>}
    </div>
  );
}

export function FormAlert({ state }: { state?: FormState }) {
  if (!state?.message) return null;
  return (
    <div role={state.ok ? "status" : "alert"} className={cn("rounded-xl px-4 py-3 text-sm", state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>
      {state.message}
    </div>
  );
}
