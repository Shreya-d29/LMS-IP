# Shreya — Admin Portal

A self-contained school administration workspace inside the Shreenil LMS repository. It does not replace or change the LMS student frontend or Spring Boot backend. The portal has its own React, TypeScript, Tailwind, Express, Prisma, and PostgreSQL application and covers dashboard analytics, people, admissions, academics, attendance, assessment, fees, communication, roles, and school settings.

## Requirements

- Node.js 20+
- npm 10+
- Docker Desktop (for bundled PostgreSQL), or PostgreSQL 14+

## Run locally

All commands below run from this `admin-portal/` directory.

1. Create local `.env` files in the project root and `server/`. Set `POSTGRES_PASSWORD`, a unique `JWT_SECRET` (at least 32 characters), and `DATABASE_URL=postgresql://shreya:<POSTGRES_PASSWORD>@localhost:5432/shreya_admin?schema=public` in both files.
2. Start the bundled PostgreSQL database:

   ```sh
   docker compose up -d database
   ```

3. Create `server/.env` with the same settings so Prisma commands can locate the database.
4. Install dependencies and prepare the database:

   ```sh
   npm install
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

5. Start the API and UI:

   ```sh
   npm run dev
   ```

   The UI is at `http://localhost:5173`; the API is at `http://localhost:4000/api`. If `localhost` resolves differently in your browser, open `http://127.0.0.1:5173`.

Demo administrator: `admin@shreya.edu` / `ChangeMe123!`. Change or remove this seeded credential before deploying anywhere accessible to other people.

## Production

Set `NODE_ENV=production`, use a private PostgreSQL service and strong secret values, set `CLIENT_ORIGIN` to the deployed UI origin, run `npm run build`, apply migrations with `npm run db:deploy`, and start with `npm start`. Serve the client build (`client/dist`) from a static host or CDN with SPA history fallback. Place TLS termination and appropriate backup/retention policies in front of the service.

## Project structure

```text
client/
  src/
    api.ts                 Axios client, session types, CSV helpers
    app.tsx                React Router, shell, sign-in, report landing
    auth.tsx               Session provider and route permission gates
    catalog.ts             Module definitions and form/table metadata
    components.tsx         Shared forms, tables, modal, toast, loading states
    pages.tsx              Dashboard and module workspaces
    styles.css             Responsive light/dark application theme
server/
  prisma/
    schema.prisma          PostgreSQL schema and relations
    seed.ts                Repeatable sample data
  src/
    auth.ts                JWT authentication and RBAC middleware
    db.ts                  Prisma client
    index.ts               Express API, CRUD handlers, dashboard analytics
.env.example
client/tailwind.config.js
client/postcss.config.js
```

## API overview

- `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/dashboard`
- `GET|POST|PATCH|DELETE /api/students`, `/api/teachers`
- `GET /api/:resource` for the other seeded management resources (classes, divisions, subjects, academic years, terms, timetable, attendance, applications, exams, marks, fee structures, invoices, payments, events, announcements, users, roles, permissions, audit, settings).
- Write permissions are checked by module and action on the API; client routes and actions also use the signed-in user's permission map.
- Validation, unique-key and referential-integrity failures return explicit client errors. Changes made through managed resources are recorded in the audit log.

The application schema includes a separate teacher attendance/leave model, document/photo URL fields, academic term and syllabus mappings, invoice/payment records, and a role permission matrix. The generated demo data includes a super-admin, a class and division, sample students and a teacher, sample fees/invoices, and upcoming events.

## Notes before production rollout

The local demo seeds sample identity and finance records. Replace them before using real student data. Configure object storage and malware scanning for uploaded documents/photos, a durable mail/SMS provider, automated encrypted database backups, and PDF/report generation/retention for your institution's compliance requirements. Authentication uses short-lived signed bearer tokens; deploy behind HTTPS and keep the JWT secret private.
