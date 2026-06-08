import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

type Row = Record<string, any>;
type Where = Record<string, any>;
type QueryOptions = { where?: Where; orderBy?: Record<string, 'asc' | 'desc'>; take?: number; include?: any; select?: any };

const supabaseUrl = () => (process.env.SUPABASE_URL || process.env.SUPABASE_URI || '').replace(/\/$/, '');
const supabaseServiceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const hasPostgresUrl = (value?: string) => value?.startsWith('postgresql://') || value?.startsWith('postgres://');
const shouldUseSupabaseRest = () => !hasPostgresUrl(process.env.DATABASE_URL) && Boolean(supabaseUrl() && supabaseServiceKey());
const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

function withTimestamps(data: Row) {
  const timestamp = now();
  return { ...data, id: data.id ?? id(), createdAt: data.createdAt ?? timestamp, updatedAt: data.updatedAt ?? timestamp };
}

function withUpdatedAt(data: Row) {
  return { ...data, updatedAt: now() };
}

class SupabaseRestDb {
  user = {
    findUnique: async (options: QueryOptions) => {
      const user = await this.findOne('User', options.where);
      return user ? this.pick(user, options.select) : null;
    },
    create: async ({ data }: { data: Row }) => this.insertOne('User', withTimestamps(data)),
    deleteMany: async () => this.deleteWhere('User'),
  };

  template = {
    findMany: async (options: QueryOptions = {}) => {
      const rows = await this.findMany('Template', options);
      return Promise.all(rows.map((row) => this.includeTemplate(row, options.include)));
    },
    findUnique: async (options: QueryOptions) => {
      const row = await this.findOne('Template', options.where);
      return row ? this.includeTemplate(row, options.include) : null;
    },
    findUniqueOrThrow: async (options: QueryOptions) => {
      const row = await this.template.findUnique(options);
      if (!row) throw new Error('Template not found');
      return row;
    },
    create: async ({ data }: { data: Row }) => {
      const { sections, ...templateData } = data;
      const template = await this.insertOne('Template', withTimestamps(templateData));
      await this.createNestedSections(template.id, sections?.create ?? []);
      return template;
    },
    update: async ({ where, data }: { where: Where; data: Row }) => this.updateOne('Template', where, withUpdatedAt(data)),
    deleteMany: async () => this.deleteWhere('Template'),
  };

  templateSection = {
    create: async ({ data }: { data: Row }) => this.insertOne('TemplateSection', withTimestamps(data)),
    update: async ({ where, data }: { where: Where; data: Row }) => this.updateOne('TemplateSection', where, withUpdatedAt(data)),
    deleteMany: async ({ where }: { where?: Where } = {}) => this.deleteWhere('TemplateSection', where),
  };

  templateItem = {
    create: async ({ data }: { data: Row }) => this.insertOne('TemplateItem', withTimestamps({ ...data, optionsJson: data.optionsJson ?? [] })),
    update: async ({ where, data }: { where: Where; data: Row }) => this.updateOne('TemplateItem', where, withUpdatedAt(data)),
    deleteMany: async ({ where }: { where?: Where } = {}) => this.deleteWhere('TemplateItem', where),
  };

  inspection = {
    findMany: async (options: QueryOptions = {}) => {
      const rows = await this.findMany('Inspection', options);
      return Promise.all(rows.map((row) => this.includeInspection(row, options.include)));
    },
    findUnique: async (options: QueryOptions) => {
      const row = await this.findOne('Inspection', options.where);
      return row ? this.includeInspection(row, options.include) : null;
    },
    create: async ({ data }: { data: Row }) => this.insertOne('Inspection', withTimestamps({ status: 'DRAFT', ...data })),
    update: async ({ where, data }: { where: Where; data: Row }) => this.updateOne('Inspection', where, withUpdatedAt(data)),
    deleteMany: async () => this.deleteWhere('Inspection'),
  };

  inspectionResponse = {
    create: async ({ data }: { data: Row }) => this.insertOne('InspectionResponse', withTimestamps({ severity: 'NONE', isCompleted: false, ...data })),
    upsert: async ({ where, update, create, include }: { where: any; update: Row; create: Row; include?: any }) => {
      const unique = where.inspectionId_templateItemId;
      const existing = await this.findOne('InspectionResponse', unique);
      const row = existing
        ? await this.updateOne('InspectionResponse', { id: existing.id }, withUpdatedAt(update))
        : await this.inspectionResponse.create({ data: create });
      return this.includeInspectionResponse(row, include);
    },
    deleteMany: async () => this.deleteWhere('InspectionResponse'),
  };

  inspectionImage = {
    create: async ({ data }: { data: Row }) => this.insertOne('InspectionImage', { ...data, id: data.id ?? id(), createdAt: data.createdAt ?? now() }),
    delete: async ({ where }: { where: Where }) => this.deleteOne('InspectionImage', where),
    deleteMany: async () => this.deleteWhere('InspectionImage'),
  };

  auditLog = {
    create: async ({ data }: { data: Row }) => this.insertOne('AuditLog', { ...data, id: data.id ?? id(), createdAt: data.createdAt ?? now() }),
    deleteMany: async () => this.deleteWhere('AuditLog'),
  };

  $transaction = async <T>(callback: (tx: this) => Promise<T>) => callback(this);
  $disconnect = async () => undefined;

  private async request(table: string, init: RequestInit & { query?: URLSearchParams } = {}) {
    const url = new URL(`${supabaseUrl()}/rest/v1/${table}`);
    init.query?.forEach((value, key) => url.searchParams.append(key, value));

    const response = await fetch(url, {
      ...init,
      headers: {
        apikey: supabaseServiceKey(),
        Authorization: `Bearer ${supabaseServiceKey()}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Supabase ${table} request failed: ${response.status} ${body}`);
    }

    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  private applyWhere(query: URLSearchParams, where?: Where) {
    Object.entries(where ?? {}).forEach(([key, value]) => {
      if (value === undefined) return;
      if (value && typeof value === 'object' && 'notIn' in value) {
        const values = (value.notIn as string[]).map((item) => `"${item}"`).join(',');
        query.set(key, `not.in.(${values})`);
      } else {
        query.set(key, `eq.${value}`);
      }
    });
  }

  private applyOrder(query: URLSearchParams, orderBy?: Record<string, 'asc' | 'desc'>) {
    const [field, direction] = Object.entries(orderBy ?? {})[0] ?? [];
    if (field) query.set('order', `${field}.${direction}`);
  }

  private async findMany(table: string, options: QueryOptions = {}) {
    const query = new URLSearchParams({ select: '*' });
    this.applyWhere(query, options.where);
    this.applyOrder(query, options.orderBy);
    if (options.take) query.set('limit', String(options.take));
    return (await this.request(table, { query })) as Row[];
  }

  private async findOne(table: string, where?: Where) {
    const rows = await this.findMany(table, { where, take: 1 });
    return rows[0] ?? null;
  }

  private async insertOne(table: string, data: Row) {
    const rows = await this.request(table, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Prefer: 'return=representation' },
    }) as Row[];
    return rows[0];
  }

  private async updateOne(table: string, where: Where, data: Row) {
    const query = new URLSearchParams({ select: '*' });
    this.applyWhere(query, where);
    const rows = await this.request(table, {
      method: 'PATCH',
      query,
      body: JSON.stringify(data),
      headers: { Prefer: 'return=representation' },
    }) as Row[];
    return rows[0];
  }

  private async deleteWhere(table: string, where?: Where) {
    const query = new URLSearchParams();
    this.applyWhere(query, where);
    await this.request(table, { method: 'DELETE', query });
    return { count: 0 };
  }

  private async deleteOne(table: string, where: Where) {
    const row = await this.findOne(table, where);
    await this.deleteWhere(table, where);
    return row;
  }

  private pick(row: Row, select?: Record<string, boolean>) {
    if (!select) return row;
    return Object.fromEntries(Object.entries(select).filter(([, enabled]) => enabled).map(([key]) => [key, row[key]]));
  }

  private async createNestedSections(templateId: string, sections: Row[]) {
    for (const section of sections) {
      const { items, ...sectionData } = section;
      const createdSection = await this.templateSection.create({ data: { ...sectionData, templateId } });
      for (const item of items?.create ?? []) {
        await this.templateItem.create({ data: { ...item, sectionId: createdSection.id } });
      }
    }
  }

  private async includeTemplate(template: Row, include?: any) {
    if (!include?.sections) return template;
    const sectionOptions = include.sections === true ? {} : include.sections;
    const sections = await this.findMany('TemplateSection', { where: { templateId: template.id }, orderBy: sectionOptions.orderBy });
    template.sections = await Promise.all(sections.map(async (section) => {
      if (!sectionOptions.include?.items) return section;
      const itemOptions = sectionOptions.include.items === true ? {} : sectionOptions.include.items;
      section.items = await this.findMany('TemplateItem', { where: { sectionId: section.id, ...itemOptions.where }, orderBy: itemOptions.orderBy });
      return section;
    }));
    return template;
  }

  private async includeInspection(inspection: Row, include?: any) {
    if (include?.responses) {
      const responseOptions = include.responses === true ? {} : include.responses;
      const responses = await this.findMany('InspectionResponse', { where: { inspectionId: inspection.id } });
      inspection.responses = await Promise.all(responses.map((response) => this.includeInspectionResponse(response, responseOptions.include)));
    }
    if (include?.template) {
      const template = await this.findOne('Template', { id: inspection.templateId });
      inspection.template = template ? await this.includeTemplate(template, include.template.include) : null;
    }
    if (include?.inspector) {
      inspection.inspector = await this.findOne('User', { id: inspection.inspectorId });
    }
    return inspection;
  }

  private async includeInspectionResponse(response: Row, include?: any) {
    if (include?.images) response.images = await this.findMany('InspectionImage', { where: { responseId: response.id } });
    return response;
  }
}

export const db: PrismaClient = shouldUseSupabaseRest()
  ? new SupabaseRestDb() as any
  : globalForPrisma.prisma ?? new PrismaClient();

if (!shouldUseSupabaseRest() && process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
