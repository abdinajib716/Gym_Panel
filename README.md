# Nextjs_admin_panel

Frontend-first Next.js admin panel starter with a protected Super Admin flow and an Access Control module.

## Current Scope

This repository currently focuses on one main feature area:

- Access Control
  - Settings
  - Users
  - Roles
  - Permissions
  - Activity Logs

## Current Features

- Next.js App Router admin shell
- Super Admin sign-in with protected dashboard routes
- Role and permission based access checks
- Access Control CRUD APIs
- Settings-driven branding
- Local image uploads for logos and avatars
- Sidebar navigation with Access Control group
- Toast feedback, form validation, and loading states
- PostgreSQL + Prisma backend integration

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- NextAuth
- SWR
- shadcn/ui primitives

## Environment

Create a `.env` file with your database and auth values.

Important variables used in this project:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `SUPERADMIN_FIRST_NAME`
- `SUPERADMIN_LAST_NAME`
- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PASSWORD`

## Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Push Prisma schema:

```bash
npm run db:push
```

Build for production:

```bash
npm run build
```

## Notes

- The repository is currently centered around Access Control as the main implemented module.
- Branding from Settings now controls the header logo.
- User-uploaded files are stored locally under `public/uploads/access-control`.
