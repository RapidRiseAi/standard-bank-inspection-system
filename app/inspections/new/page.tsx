import { AppShell } from '@/components/layout/AppShell';
import { NewInspectionForm } from '@/components/inspections/NewInspectionForm';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function NewInspection({ searchParams }: { searchParams: Promise<{ templateId?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const templates = await db.template.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });

  return (
    <AppShell user={user}>
      <h1 className="mb-4 text-3xl font-black text-navy">Start inspection</h1>
      <NewInspectionForm
        templates={templates.map((template) => ({ id: template.id, name: template.name }))}
        defaultTemplateId={sp.templateId}
        inspectorName={user.name}
        defaultScheduledDate={new Date().toISOString().slice(0, 10)}
      />
    </AppShell>
  );
}
