'use client';

import { useActionState } from 'react';
import type { CreateInspectionState } from '@/app/actions';
import { createInspection } from '@/app/actions';

type TemplateOption = {
  id: string;
  name: string;
};

type Props = {
  templates: TemplateOption[];
  defaultTemplateId?: string;
  inspectorName: string;
  defaultScheduledDate: string;
};

const initialState: CreateInspectionState = {
  ok: true,
  values: {},
  fieldErrors: {},
};

function fieldValue(state: CreateInspectionState, name: string, fallback = '') {
  return state.values?.[name] ?? fallback;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm font-medium text-red-700">{message}</p>;
}

export function NewInspectionForm({ templates, defaultTemplateId, inspectorName, defaultScheduledDate }: Props) {
  const [state, formAction, isPending] = useActionState(createInspection, initialState);
  const selectedTemplate = fieldValue(state, 'templateId', defaultTemplateId ?? templates[0]?.id ?? '');

  return (
    <form action={formAction} className="grid gap-3 rounded-2xl bg-white p-5 shadow-soft" noValidate>
      {!state.ok && state.message && (
        <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{state.message}</p>
      )}

      <label className="font-semibold">
        Template
        <select name="templateId" defaultValue={selectedTemplate} className="mt-1 w-full rounded-xl border p-3" required>
          {templates.map((template) => (
            <option value={template.id} key={template.id}>{template.name}</option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.templateId} />
      </label>

      {[
        ['clientName', 'Client name'],
        ['propertyName', 'Property / building name'],
        ['propertyAddress', 'Property address'],
        ['inspectionType', 'Inspection type'],
      ].map(([name, label]) => (
        <label key={name} className="font-semibold">
          {label}
          <input name={name} defaultValue={fieldValue(state, name)} className="mt-1 w-full rounded-xl border p-3" required />
          <FieldError message={state.fieldErrors?.[name]} />
        </label>
      ))}

      <label className="font-semibold">
        Inspector
        <input value={inspectorName} readOnly className="mt-1 w-full rounded-xl border bg-slate-50 p-3" />
      </label>

      <label className="font-semibold">
        Scheduled date
        <input
          type="date"
          name="scheduledDate"
          defaultValue={fieldValue(state, 'scheduledDate', defaultScheduledDate)}
          className="mt-1 w-full rounded-xl border p-3"
          required
        />
        <FieldError message={state.fieldErrors?.scheduledDate} />
      </label>

      <label className="font-semibold">
        Reference number
        <input name="referenceNumber" defaultValue={fieldValue(state, 'referenceNumber')} className="mt-1 w-full rounded-xl border p-3" />
        <FieldError message={state.fieldErrors?.referenceNumber} />
      </label>

      <label className="font-semibold">
        Notes
        <textarea name="notes" defaultValue={fieldValue(state, 'notes')} className="mt-1 w-full rounded-xl border p-3" />
        <FieldError message={state.fieldErrors?.notes} />
      </label>

      <button disabled={isPending || templates.length === 0} className="touch rounded-xl bg-navy font-bold text-white disabled:opacity-50">
        {isPending ? 'Starting…' : 'Start Inspection'}
      </button>
    </form>
  );
}
