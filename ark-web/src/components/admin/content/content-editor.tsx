"use client";

import { useEffect, useId, useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveContentAction, resetContentAction, type ContentSaveState } from "@/server/actions/content";
import { blankFor, fieldKind, humanize, isImageArrayKey, type Shape } from "@/lib/content-schema";
import { FIELD_LABELS, FIELD_OPTIONS } from "@/content/sections";
import { cn } from "@/lib/utils";
import { ImageField } from "./image-picker";

type Value = unknown;
type ObjShape = Extract<Shape, { kind: "object" }>;

const labelFor = (key: string) => FIELD_LABELS[key]?.label ?? humanize(key);
const hintFor = (key: string) => FIELD_LABELS[key]?.hint;

/** Best human title for a list item card. */
function itemTitle(v: Value, i: number): string {
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    for (const k of ["name", "title", "year", "label", "alt", "key"]) if (typeof o[k] === "string" && o[k]) return String(o[k]);
  }
  return `Item ${i + 1}`;
}

export function ContentEditor({
  sectionKey,
  shape,
  initial,
  viewHref,
  isCustomised,
}: {
  sectionKey: string;
  shape: Shape;
  initial: Value;
  viewHref: string;
  isCustomised: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<Value>(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [state, setState] = useState<ContentSaveState>({ ok: false });
  const [pending, start] = useTransition();
  const dirty = useMemo(() => JSON.stringify(value) !== baseline, [value, baseline]);

  const save = () =>
    start(async () => {
      const json = JSON.stringify(value);
      const res = await saveContentAction(sectionKey, json);
      setState(res);
      if (res.ok) {
        setBaseline(json);
        router.refresh();
      }
    });

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  // Ctrl/Cmd+S to save.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !pending) save();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const reset = () => {
    if (!confirm("Reset this whole section to the original text? Your current version will be kept in the history so you can restore it.")) return;
    start(async () => {
      const res = await resetContentAction(sectionKey);
      setState(res);
      if (res.ok) {
        router.refresh();
        window.location.reload();
      }
    });
  };

  return (
    <div className="pb-28">
      {state.issues && state.issues.length > 0 && (
        <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">{state.message}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {state.issues.map((i, n) => (
              <li key={n}>
                {i.path && <strong>{i.path}: </strong>}
                {i.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {shape.kind === "object" ? (
        <ObjectFields shape={shape} value={value} onChange={setValue} depth={0} />
      ) : (
        <p>Unsupported section shape.</p>
      )}

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:left-[250px]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <p className={cn("mr-auto text-sm", state.ok && !dirty ? "text-emerald-700" : dirty ? "text-amber-700" : "text-muted")} role="status">
            {pending ? "Saving…" : dirty ? "● Unsaved changes" : state.ok ? `✓ ${state.message}` : isCustomised ? "Showing your edited version" : "Showing the original text"}
          </p>
          <Link href={viewHref} target="_blank" className="btn-outline px-4 py-2">View page ↗</Link>
          {dirty && (
            <button
              type="button"
              className="btn-outline px-4 py-2"
              onClick={() => {
                setValue(JSON.parse(baseline));
                setState({ ok: false });
              }}
            >
              Discard changes
            </button>
          )}
          {isCustomised && !dirty && (
            <button type="button" className="btn-outline px-4 py-2 text-red-600" onClick={reset} disabled={pending}>
              Reset to original
            </button>
          )}
          <button type="button" className="btn-primary px-6 py-2" onClick={save} disabled={!dirty || pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recursive field renderers
// ---------------------------------------------------------------------------

function ObjectFields({ shape, value, onChange, depth }: { shape: ObjShape; value: Value; onChange: (v: Value) => void; depth: number }) {
  const obj = (value && typeof value === "object" ? value : {}) as Record<string, Value>;
  const set = (k: string, v: Value) => onChange({ ...obj, [k]: v });

  // Simple fields first, then nested groups and lists — reads naturally.
  const isScalar = (s: Shape) => s.kind === "string" || s.kind === "number" || s.kind === "boolean";
  const entries = Object.entries(shape.fields);
  const simple = entries.filter(([, f]) => isScalar(f.shape));
  const complex = entries.filter(([, f]) => !isScalar(f.shape));

  return (
    <div className={cn("space-y-5", depth === 0 && "space-y-6")}>
      {simple.length > 0 && (
        <div className={cn("grid gap-5", depth === 0 ? "rounded-2xl border border-line bg-white p-6" : "", "md:grid-cols-2")}>
          {simple.map(([k, f]) => (
            <ScalarField key={k} fieldKey={k} shape={f.shape} optional={f.optional} value={obj[k]} onChange={(v) => set(k, v)} />
          ))}
        </div>
      )}
      {complex.map(([k, f]) => (
        <Group key={k} title={labelFor(k)} hint={hintFor(k)} depth={depth} optional={f.optional}>
          {f.shape.kind === "object" ? (
            <ObjectFields shape={f.shape} value={obj[k] ?? blankFor(f.shape)} onChange={(v) => set(k, v)} depth={depth + 1} />
          ) : f.shape.kind === "stringArray" ? (
            <StringList fieldKey={k} value={(obj[k] as string[]) ?? []} onChange={(v) => set(k, v)} />
          ) : f.shape.kind === "objectArray" ? (
            <ObjectList fieldKey={k} shape={f.shape.item} value={(obj[k] as Value[]) ?? []} onChange={(v) => set(k, v)} depth={depth + 1} />
          ) : null}
        </Group>
      ))}
    </div>
  );
}

function Group({ title, hint, depth, optional, children }: { title: string; hint?: string; depth: number; optional?: boolean; children: ReactNode }) {
  if (depth === 0) {
    return (
      <section className="rounded-2xl border border-line bg-white">
        <header className="border-b border-line px-6 py-4">
          <h2 className="font-semibold">{title}{optional && <span className="ml-2 text-xs font-normal text-muted">optional</span>}</h2>
          {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
        </header>
        <div className="p-6">{children}</div>
      </section>
    );
  }
  return (
    <fieldset className="rounded-xl border border-line p-4 md:col-span-2">
      <legend className="px-1 text-sm font-semibold">
        {title}
        {optional && <span className="ml-2 text-xs font-normal text-muted">optional</span>}
      </legend>
      {hint && <p className="-mt-1 mb-3 text-xs text-muted">{hint}</p>}
      {children}
    </fieldset>
  );
}

function ScalarField({ fieldKey, shape, optional, value, onChange }: { fieldKey: string; shape: Shape; optional: boolean; value: Value; onChange: (v: Value) => void }) {
  const options = FIELD_OPTIONS[fieldKey];
  const kind = fieldKind(fieldKey, value ?? (shape.kind === "number" ? 0 : shape.kind === "boolean" ? false : ""), options);
  const id = useId();
  const label = (
    <label htmlFor={id} className="field-label">
      {labelFor(fieldKey)}
      {optional && <span className="ml-2 text-xs font-normal text-muted">optional</span>}
    </label>
  );
  const hint = hintFor(fieldKey) && fieldKey !== "body" ? <p className="mt-1 text-xs text-muted">{hintFor(fieldKey)}</p> : null;
  const str = typeof value === "string" ? value : "";

  if (kind === "boolean") {
    return (
      <label className="flex items-center gap-3 text-sm md:col-span-2">
        <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-brand-600" />
        <span className="font-medium">{labelFor(fieldKey)}</span>
      </label>
    );
  }
  if (kind === "image") {
    return (
      <div className="md:col-span-2">
        <span className="field-label">{labelFor(fieldKey)}</span>
        <ImageField value={str} onChange={onChange} allowEmpty={optional} />
      </div>
    );
  }
  if (kind === "textarea") {
    return (
      <div className="md:col-span-2">
        {label}
        <textarea id={id} value={str} rows={4} onChange={(e) => onChange(e.target.value)} className="field [field-sizing:content] min-h-24" />
        {hint}
      </div>
    );
  }
  if (kind === "select" && options) {
    return (
      <div>
        {label}
        <select id={id} value={str} onChange={(e) => onChange(e.target.value)} className="field">
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div>
      {label}
      <input
        id={id}
        type={kind === "number" ? "number" : kind === "email" ? "email" : "text"}
        inputMode={kind === "number" ? "numeric" : kind === "link" ? "url" : undefined}
        value={kind === "number" ? String(value ?? 0) : str}
        onChange={(e) => onChange(kind === "number" ? Number(e.target.value) : e.target.value)}
        className="field"
        placeholder={kind === "link" ? "/page or https://…" : undefined}
      />
      {hint}
    </div>
  );
}

function MoveButtons({ index, length, onMove, onRemove, onDuplicate }: { index: number; length: number; onMove: (to: number) => void; onRemove: () => void; onDuplicate?: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => onMove(index - 1)} className="rounded-lg px-2 py-1 text-muted hover:bg-surface disabled:opacity-30">↑</button>
      <button type="button" aria-label="Move down" disabled={index === length - 1} onClick={() => onMove(index + 1)} className="rounded-lg px-2 py-1 text-muted hover:bg-surface disabled:opacity-30">↓</button>
      {onDuplicate && (
        <button type="button" aria-label="Duplicate" onClick={onDuplicate} className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-surface">Copy</button>
      )}
      <button type="button" aria-label="Remove" onClick={onRemove} className="rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50">Remove</button>
    </div>
  );
}

function move<T>(arr: T[], from: number, to: number) {
  const next = arr.slice();
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it as T);
  return next;
}

function StringList({ fieldKey, value, onChange }: { fieldKey: string; value: string[]; onChange: (v: string[]) => void }) {
  const isParagraphs = fieldKey === "body";
  const isImages = isImageArrayKey(fieldKey);
  const update = (i: number, v: string) => onChange(value.map((x, n) => (n === i ? v : x)));
  return (
    <div className="space-y-3">
      {value.map((v, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-2.5 w-6 shrink-0 text-right text-xs text-muted">{i + 1}.</span>
          <div className="min-w-0 flex-1">
            {isImages ? (
              <ImageField value={v} onChange={(nv) => update(i, nv)} allowEmpty={false} />
            ) : isParagraphs ? (
              <textarea value={v} rows={3} onChange={(e) => update(i, e.target.value)} className="field [field-sizing:content] min-h-20" aria-label={`Paragraph ${i + 1}`} />
            ) : (
              <input value={v} onChange={(e) => update(i, e.target.value)} className="field" aria-label={`${labelFor(fieldKey)} ${i + 1}`} />
            )}
          </div>
          <MoveButtons index={i} length={value.length} onMove={(to) => onChange(move(value, i, to))} onRemove={() => onChange(value.filter((_, n) => n !== i))} />
        </div>
      ))}
      <button type="button" className="btn-outline px-4 py-2 text-xs" onClick={() => onChange([...value, ""])}>
        + Add {isParagraphs ? "paragraph" : isImages ? "image" : "item"}
      </button>
    </div>
  );
}

function ObjectList({ fieldKey, shape, value, onChange, depth }: { fieldKey: string; shape: ObjShape; value: Value[]; onChange: (v: Value[]) => void; depth: number }) {
  const [open, setOpen] = useState<number | null>(value.length <= 3 ? -1 : 0); // -1 = all open; otherwise first item open
  const isOpen = (i: number) => open === -1 || open === i;
  const add = () => {
    onChange([...value, blankFor(shape)]);
    setOpen(value.length);
  };
  return (
    <div className="space-y-3">
      {value.map((item, i) => (
        <div key={i} className="rounded-xl border border-line bg-white">
          <div className="flex items-center gap-2 px-3 py-2">
            <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setOpen(isOpen(i) ? null : i)} aria-expanded={isOpen(i)}>
              <span className={cn("text-xs text-muted transition-transform", isOpen(i) && "rotate-90")}>▶</span>
              <span className="truncate text-sm font-semibold">{itemTitle(item, i)}</span>
            </button>
            <MoveButtons
              index={i}
              length={value.length}
              onMove={(to) => onChange(move(value, i, to))}
              onDuplicate={() => onChange([...value.slice(0, i + 1), structuredClone(item), ...value.slice(i + 1)])}
              onRemove={() => {
                if (confirm(`Remove “${itemTitle(item, i)}”?`)) onChange(value.filter((_, n) => n !== i));
              }}
            />
          </div>
          {isOpen(i) && (
            <div className="border-t border-line p-4">
              <ObjectFields shape={shape} value={item} onChange={(v) => onChange(value.map((x, n) => (n === i ? v : x)))} depth={depth} />
            </div>
          )}
        </div>
      ))}
      <button type="button" className="btn-outline px-4 py-2 text-xs" onClick={add}>
        + Add {fieldKey === "items" ? "ministry" : fieldKey === "milestones" ? "milestone" : fieldKey === "photos" ? "photo" : "item"}
      </button>
    </div>
  );
}
