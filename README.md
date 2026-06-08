# BuildInspect Demo

BuildInspect Demo is a mobile-first building inspection management system designed for a Standard Bank-linked enterprise inspection demo. It provides a production-friendly SaaS foundation for checklist templates, field inspection capture, evidence photos, persisted responses, summaries, and report-style client review pages.

## Tech stack

- Next.js App Router with TypeScript and React Server Components
- Tailwind CSS mobile-first UI
- Prisma ORM with PostgreSQL
- Zod validation for incoming form/API payloads
- Custom secure demo login using bcrypt password hashes and an HTTP-only session cookie
- Supabase Storage-compatible image upload structure with local placeholder fallback when storage is not configured

## What the app does

- Admins can create, duplicate, edit, preview, and manage inspection checklist templates.
- Template builder supports sections, checklist items, active/inactive items, ordering, dropdown/multi-select options stored as JSON, required flags, photo flags, and severity flags.
- Inspectors can start inspections from templates, capture mobile-friendly responses, upload photo evidence, save drafts, resume work, and complete inspections only when required items are done.
- Completed inspections become read-only.
- Summary and report pages display saved inspection details, severity counts, responses, comments, and photos.
- Reports include print styles and a browser “Print / Save as PDF” action.

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/buildinspect?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/buildinspect?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_STORAGE_BUCKET="inspection-images"
```

`DATABASE_URL` and `DIRECT_URL` must never be exposed to the browser. `SUPABASE_SERVICE_ROLE_KEY` is server-only and is used only by the upload route.

## Local setup

```bash
npm install
cp .env.example .env
# edit .env with PostgreSQL and optional Supabase Storage settings
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000` and sign in with one of the demo users.

## Database setup

1. Create a PostgreSQL database locally, in Supabase, Neon, or another managed Postgres provider.
2. Set `DATABASE_URL` and `DIRECT_URL` in `.env`.
3. Run:

```bash
npm run db:migrate
npm run db:seed
```

The Prisma schema includes scalable models for users, templates, sections, checklist items, inspections, responses, images, and audit logs.

## Seeded demo data

The seed command creates:

- Admin User: `admin@buildinspect.demo` / `password123`
- Field Inspector: `inspector@buildinspect.demo` / `password123`
- A realistic template named **Standard Building Condition Inspection** with 8 sections and 26 checklist items.
- One completed inspection for **Standard Bank Facilities Demo** at **Riverside Commercial Building**.
- One draft inspection ready for mobile capture.

## Image storage

The upload route validates images server-side:

- Max file size: 8MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- File names are sanitized before storage path generation

If `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` are configured, images are uploaded to Supabase Storage and image metadata is saved in PostgreSQL. If storage is not configured, the demo stores a placeholder public URL while preserving the database structure needed for real uploads.

## Deployment to Vercel

1. Push the repo to GitHub.
2. Create a Vercel project from the repo.
3. Add all environment variables in Vercel Project Settings.
4. Provision PostgreSQL and set `DATABASE_URL` / `DIRECT_URL`.
5. Run Prisma migrations during deployment or from a trusted admin machine:

```bash
npx prisma migrate deploy
npx prisma db seed
```

6. Deploy the app. The build script runs `prisma generate` before `next build`.

## Build commands

```bash
npm run lint
npm run build
```

## Known demo limitations

- Authentication is intentionally simple for the demo and should be replaced or extended with hardened enterprise auth for production.
- No full offline sync queue is implemented yet, although server persistence is used for core data.
- Browser print is used for report export instead of server-side branded PDF generation.
- Image deletion from storage should be expanded with provider-specific cleanup policies.
- Multi-tenant organization boundaries are not yet implemented.

## Suggested next enterprise features

- Offline mode with sync queue
- Role-based client portals
- Digital signatures
- GPS capture
- QR code inspection references
- PDF generation with branded templates
- Client approval workflow
- Automated email reports
- Integration with Microsoft/Google Drive
- SLA tracking
- Multi-branch/team management
- Advanced audit logs
- Bank-grade access controls
- SSO/SAML login
