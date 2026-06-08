import bcrypt from 'bcryptjs';
import { db } from './db';

const demoUsers = [
  { name: 'Admin User', email: 'admin@buildinspect.demo', role: 'ADMIN' as const },
  { name: 'Field Inspector', email: 'inspector@buildinspect.demo', role: 'INSPECTOR' as const },
];

export async function ensureDemoData() {
  const passwordHash = await bcrypt.hash('password123', 12);
  let admin = await db.user.findUnique({ where: { email: 'admin@buildinspect.demo' } });

  for (const user of demoUsers) {
    const existing = await db.user.findUnique({ where: { email: user.email } });
    if (!existing) {
      const created = await db.user.create({ data: { ...user, passwordHash } });
      if (user.role === 'ADMIN') admin = created;
    }
  }

  if (!admin) return;

  const templates = await db.template.findMany({ take: 1 });
  if (templates.length > 0) return;

  await db.template.create({
    data: {
      name: 'Standard Building Condition Inspection',
      description: 'A practical starter checklist for assessing general building condition, safety, visible defects, maintenance issues, and priority repair items during an on-site property inspection.',
      buildingType: 'Commercial',
      category: 'Maintenance / Condition Assessment',
      createdById: admin.id,
      sections: {
        create: [
          {
            title: 'External condition',
            description: 'Capture visible external defects and safety concerns.',
            sortOrder: 1,
            items: {
              create: [
                {
                  title: 'External walls and facade condition',
                  instruction: 'Check for cracks, damp, loose panels, impact damage, and visible deterioration.',
                  responseType: 'CHECKBOX',
                  isRequired: true,
                  requiresPhoto: true,
                  requiresSeverity: true,
                  allowPhoto: true,
                  optionsJson: [],
                  sortOrder: 1,
                  isActive: true,
                },
                {
                  title: 'Roof drainage and gutters',
                  instruction: 'Inspect drainage routes for blockage, corrosion, leaks, and overflow staining.',
                  responseType: 'YES_NO_NA',
                  isRequired: true,
                  requiresPhoto: false,
                  requiresSeverity: true,
                  allowPhoto: true,
                  optionsJson: [],
                  sortOrder: 2,
                  isActive: true,
                },
              ],
            },
          },
          {
            title: 'Internal safety',
            description: 'Record safety, access, and operational issues inside the building.',
            sortOrder: 2,
            items: {
              create: [
                {
                  title: 'Emergency exits and walkways clear',
                  instruction: 'Confirm that emergency routes are unobstructed, signed, and accessible.',
                  responseType: 'CHECKBOX',
                  isRequired: true,
                  requiresPhoto: false,
                  requiresSeverity: true,
                  allowPhoto: true,
                  optionsJson: [],
                  sortOrder: 1,
                  isActive: true,
                },
                {
                  title: 'Inspector notes',
                  instruction: 'Add any general observations that should appear in the inspection report.',
                  responseType: 'TEXT',
                  isRequired: false,
                  requiresPhoto: false,
                  requiresSeverity: false,
                  allowPhoto: true,
                  optionsJson: [],
                  sortOrder: 2,
                  isActive: true,
                },
              ],
            },
          },
        ],
      },
    },
  });
}
