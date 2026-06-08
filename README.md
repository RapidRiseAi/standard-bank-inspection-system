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

For the minimal Vercel + Supabase setup, set only these project variables:

```bash
SUPABASE_URL="https://PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="replace-with-your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="replace-with-your-supabase-service-role-key"
AUTH_SECRET="replace-with-a-long-random-secret"
```

- `SUPABASE_URL` is the Supabase project/API URL. The app also accepts `SUPABASE_URI` as an alias if that is the name already configured in Vercel.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and is used for application database reads/writes through Supabase REST plus server-side Storage uploads. Never expose it to the browser.
- `AUTH_SECRET` signs the app's HTTP-only login cookie in production. Generate a long random value for Vercel, for example with `openssl rand -base64 32`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is included for Supabase/Vercel compatibility. It is public by design and is **not** used by server-side image uploads.

Optional overrides:

```bash
SUPABASE_STORAGE_BUCKET="inspection-images"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

`DATABASE_URL` is no longer required for the Vercel runtime. If you provide a PostgreSQL `DATABASE_URL` for local development, the app uses Prisma directly; otherwise it uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` at runtime.

## Troubleshooting Vercel login setup

If login fails after switching to the Supabase-only variable set, check these items:

1. `SUPABASE_URL` must be the project URL, for example `https://PROJECT_REF.supabase.co`.
2. `SUPABASE_SERVICE_ROLE_KEY` must be the service-role key, not the anon key.
3. The Supabase migrations in `supabase/migrations/` must be applied to the project so the app tables exist.
4. Redeploy Vercel after editing environment variables.

The app creates the demo users and a starter inspection template automatically on first login when the tables are empty, so `npx prisma db seed` is not required for the Supabase-only Vercel setup.

## Local setup

```bash
npm install
cp .env.example .env
# edit .env with your Supabase project settings
npm run dev
```

Open `http://localhost:3000` and sign in with one of the demo users.

## Database setup

For Vercel, connect this repository to Supabase and apply the checked-in SQL migration in `supabase/migrations/`. At runtime, the app can read and write data through Supabase REST using only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

For local Prisma development, you can optionally set `DATABASE_URL` and run:

```bash
npm run db:migrate
npm run db:seed
```

The Prisma schema includes scalable models for users, templates, sections, checklist items, inspections, responses, images, and audit logs.

## Seeded demo data

The optional Prisma seed command creates the full demo dataset. In the Supabase-only Vercel runtime, the first login creates the demo users and a starter template automatically:

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

The app uses `SUPABASE_URL` for Supabase Storage and also accepts `SUPABASE_URI` as an alias. If neither is set, uploads return a server-side configuration error explaining that Supabase Storage needs `SUPABASE_URL`.

## Deployment to Vercel

1. Push the repo to GitHub.
2. Create a Vercel project from the repo.
3. Add the minimal Supabase/Vercel environment variables in Vercel Project Settings:

```bash
SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
AUTH_SECRET
```

4. Confirm that your Supabase Storage bucket exists. By default, the app uploads to `inspection-images`.
5. Apply the committed Supabase migration through the Supabase GitHub integration or Supabase CLI. The app seeds demo users automatically on first login.

A Supabase CLI migration is checked in at `supabase/migrations/20260608000000_initial_schema.sql` for teams that prefer workflows such as `supabase db push`; it creates the same application tables and ensures the default public `inspection-images` Storage bucket exists with the app's 8MB JPG/PNG/WEBP limits.

6. Deploy the app. The build script runs `prisma generate` before `next build` for local/optional Prisma compatibility.

Optional Vercel variables are available for custom deployments: `SUPABASE_STORAGE_BUCKET`, `NEXTAUTH_SECRET`, and `NEXT_PUBLIC_APP_URL`.


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
