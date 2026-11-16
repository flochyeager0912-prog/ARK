"use client";

import { useActionState } from "react";
import { updateEnquiryAction, updateVolunteerAction } from "@/server/actions/admin";
import type { FormState } from "@/lib/validation";
import { FormAlert, SubmitButton } from "@/components/forms/fields";

export function EnquiryStatusForm({ id, status, notes }: { id: string; status: string; notes: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateEnquiryAction.bind(null, id), { ok: false });
  return (
    <form action={action} className="space-y-4">
      <FormAlert state={state} />
      <div>
        <label className="field-label" htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={status} className="field">
          <option value="NEW">New</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="adminNotes">Internal notes</label>
        <textarea id="adminNotes" name="adminNotes" rows={6} defaultValue={notes} maxLength={5000} className="field" placeholder="Who followed up, what was agreed…" />
        <p className="mt-1 text-xs text-muted">Only visible to staff.</p>
      </div>
      <SubmitButton pendingText="Saving…">Save</SubmitButton>
    </form>
  );
}

export function VolunteerStatusForm({ id, status, notes }: { id: string; status: string; notes: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateVolunteerAction.bind(null, id), { ok: false });
  return (
    <form action={action} className="space-y-4">
      <FormAlert state={state} />
      <div>
        <label className="field-label" htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={status} className="field">
          <option value="SUBMITTED">Submitted (new)</option>
          <option value="ON_HOLD">On hold / in screening</option>
          <option value="APPROVED">Approved</option>
          <option value="DECLINED">Declined</option>
        </select>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="notify" defaultChecked className="mt-0.5 h-4 w-4 accent-brand-600" />
        Email the applicant when approved or declined
      </label>
      <div>
        <label className="field-label" htmlFor="adminNotes">Internal notes</label>
        <textarea id="adminNotes" name="adminNotes" rows={6} defaultValue={notes} maxLength={5000} className="field" placeholder="References checked, conversation notes, team leader assigned…" />
      </div>
      <SubmitButton pendingText="Saving…">Save</SubmitButton>
    </form>
  );
}
