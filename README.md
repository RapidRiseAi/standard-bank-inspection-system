# BuildInspect Demo

BuildInspect Demo is a mobile-first building inspection management system designed for a Standard Bank-linked enterprise inspection demo. It provides a production-friendly SaaS foundation for checklist templates, field inspection capture, evidence photos, persisted responses, summaries, and report-style client review pages.

## Tech stack

- Next.js App Router with TypeScript and React Server Components
- Tailwind CSS mobile-first UI
- Prisma ORM with PostgreSQL
- Zod validation for incoming form/API payloads
- Custom secure demo login using bcrypt password hashes and an HTTP-only session cookie
- Supabase Storage-compatible image upload structure using server-side service-role credentials

## What the app does

- Admins can create, duplicate, edit, preview, and manage inspection checklist templates.
- Template builder supports sections, checklist items, active/inactive items, ordering, dropdown/multi-select options stored as JSON, required flags, photo flags, and severity flags.
- Inspectors can start inspections from templates, capture mobile-friendly responses, upload photo evidence, save drafts, resume work, and complete inspections only when required items are done.
- Completed inspections become read-only.
- Summary and report pages display saved inspection details, severity counts, responses, comments, and photos.
- Reports include print styles and a browser “Print / Save as PDF” action.

## Environment variables

Copy `.env.example` to `.env` for local development. For the minimal Vercel + Supabase setup, set only these variables:

```bash
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
NEXT_PUBLIC_SUPABASE_ANON_KEY="replace-with-your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="replace-with-your-supabase-service-role-key"
```

- `DATABASE_URL` is the only Prisma database variable required. `DIRECT_URL` is not required.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and is used for Supabase Storage uploads and as a production auth-secret fallback when `AUTH_SECRET` / `NEXTAUTH_SECRET` are not set. Never expose it to the browser.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is included for Supabase/Vercel compatibility. It is public by design and is **not** used by server-side image uploads.

Optional overrides:

```bash
SUPABASE_URL="https://PROJECT_REF.supabase.co"
SUPABASE_STORAGE_BUCKET="inspection-images"
AUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

`SUPABASE_URL` is optional because the app can derive `https://PROJECT_REF.supabase.co` from common Supabase `DATABASE_URL` formats, including direct hosts like `db.PROJECT_REF.supabase.co` and pooler URLs whose username is `postgres.PROJECT_REF`. The default storage bucket is `inspection-images`; set `SUPABASE_STORAGE_BUCKET` only if you use a different bucket name.

## Local setup

```bash
npm install
cp .env.example .env
# edit .env with your Supabase PostgreSQL and service-role settings
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000` and sign in with one of the demo users.

## Database setup

1. Create a PostgreSQL database locally, in Supabase, Neon, or another managed Postgres provider.
2. Set `DATABASE_URL` in `.env`.
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

Images are uploaded to Supabase Storage with `SUPABASE_SERVICE_ROLE_KEY`; server uploads do not use `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The storage bucket defaults to `inspection-images`, so `SUPABASE_STORAGE_BUCKET` is only needed when you want a different bucket.

The app uses `SUPABASE_URL` when it is set. If it is not set, the app derives the project URL from `DATABASE_URL` for common Supabase direct database URLs (`db.PROJECT_REF.supabase.co`) and pooler URLs where the username is `postgres.PROJECT_REF`. If the URL cannot be determined, uploads return a server-side configuration error explaining that Supabase Storage needs `SUPABASE_URL` or a recognizable Supabase `DATABASE_URL`.

## Deployment to Vercel

1. Push the repo to GitHub.
2. Create a Vercel project from the repo.
3. Add the minimal Supabase/Vercel environment variables in Vercel Project Settings:

```bash
DATABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

4. Confirm that your Supabase Storage bucket exists. By default, the app uploads to `inspection-images`.
5. Run the committed database migration during deployment or from a trusted admin machine:

```bash
npx prisma migrate deploy
npx prisma db seed
```

A Supabase CLI migration is also checked in at `supabase/migrations/20260608000000_initial_schema.sql` for teams that prefer workflows such as `supabase db push`; it creates the same application tables and ensures the default public `inspection-images` Storage bucket exists with the app's 8MB JPG/PNG/WEBP limits.

6. Deploy the app. The build script runs `prisma generate` before `next build`.

Optional Vercel variables are available for custom deployments: `SUPABASE_URL`, `SUPABASE_STORAGE_BUCKET`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, and `NEXT_PUBLIC_APP_URL`.


## Keeping Supabase in sync with GitHub

This repository now includes both `supabase/migrations/` and `supabase/config.toml` so Supabase can treat Git as the source of truth for database schema and Storage bucket configuration.

To keep the remote Supabase project up to date automatically:

1. In the Supabase Dashboard, open **Project Settings → Integrations → GitHub Integration**.
2. Connect this GitHub repository to the Supabase project.
3. Set the integration **Working directory** to `.` because the `supabase/` folder lives at the repository root.
4. Enable **Deploy to production** for the production branch you merge into, usually `main`.
5. Enable **Automatic branching** if you want preview Supabase branches for pull requests.
6. In GitHub branch protection, require the Supabase preview/deployment status check before merging schema changes.

When a PR containing changes under `supabase/` is merged to the production branch, the Supabase GitHub integration applies pending SQL migrations from `supabase/migrations/` and deploys supported configuration from `supabase/config.toml`, including the default `inspection-images` Storage bucket. If your project is still empty, confirm the integration is connected to this repository and production branch, then merge or re-run a commit that contains the current `supabase/` directory.

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
