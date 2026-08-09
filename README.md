# Gym Management System

Protected Next.js gym management system for managing a gym operation end to end: members, trainers, plans, subscriptions, payments, attendance, notifications, reports, settings, access control, mobile member APIs, mobile trainer APIs, push notifications, and WaafiPay online payment configuration.

The system keeps the existing admin foundation intact: authentication, dashboard shell, sidebar navigation, roles, permissions, settings, and access-control flows are reused instead of rebuilt.

## Documentation Map

- `API_END_TO_END_OVERVIEW.md` - human-friendly end-to-end API map across admin, member mobile, trainer mobile, auth, settings, payments, and uploads.
- `DATABASE_END_TO_END_OVERVIEW.md` - database table, enum, relationship, index, delete behavior, and sensitive data overview.
- `MOBILE_MEMBER_API_CONTRACT.md` - member mobile endpoint contract and example payloads.
- `MOBILE_MEMBER_API_SMOKE_RESPONSES.md` - member mobile smoke test response examples.
- `TRAINER_MOBILE_API_TRAINING.md` - trainer management and trainer mobile workflow guide.
- `TRAINER_MOBILE_API_TEST_REPORT.md` - trainer mobile API test report.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui-style primitives and Radix UI components
- Prisma ORM
- PostgreSQL
- NextAuth credentials authentication
- SWR for client data fetching and cache updates
- Zod for request and form validation
- React Hook Form
- Sonner toast feedback
- Lucide React icons

## Core Features

- Protected dashboard pages backed by NextAuth sessions.
- Role and permission based access checks for pages and APIs.
- Superadmin bootstrap through environment variables.
- Admin shell with existing layout, sidebar, header, and access-control navigation.
- Settings-driven branding, appearance, email configuration, Firebase config, and WaafiPay config.
- Firebase Cloud Messaging push support through Firebase Admin SDK.
- Local image uploads for branding assets and user/member images.
- Activity logs for important admin and gym actions.
- Loading, empty, validation, and toast states across admin workflows.
- Admin forgot-password and reset-password flow using the existing Email Configuration.
- Automatic member/trainer mobile login credential generation after admin creates a record.
- Bulk delete support across gym CRUD tables.

## Gym Modules

- Dashboard overview with gym metrics.
- Members CRUD with profile details, status, trainer assignment, subscription, and initial payment support.
- Trainers CRUD with specialty, availability, and active/inactive status.
- Member and trainer View Details screens include Login Details fallback, hidden temporary password reveal, copy action, and welcome email resend action.
- Trainer account management includes password reset, mobile login block/unblock, and assigned-member management.
- Trainer mobile workflow supports assigned members, trainer groups, workouts, schedules, attendance summaries, and workout image uploads.
- Member mobile workflow supports dashboard, plans, subscription history, renew/upgrade requests, Waafi payments, notifications, assigned workouts, and schedules.
- Membership plans CRUD with type, duration, price, description, and status.
- Subscriptions CRUD with member, plan, start date, expiry date, status, and payment status.
- Payments list and manual payment creation.
- WaafiPay online payment initiation and status endpoint.
- Attendance manual check-in, history, filters, and reporting.
- Notifications for announcements, payment reminders, subscription expiry, upgrade confirmations, and general messages.
- Mobile device token registration for member/trainer push notifications.
- Reports for members, subscriptions, payments, attendance, and revenue.
- CSV and PDF report exports with human-readable column labels.

## Access Control

- Users management.
- Roles management.
- Permissions management.
- Activity logs.
- Protected route middleware through `proxy.ts`.
- API permission checks with `requirePermission`.

Additional permissions include:

- `waafi_config.view`
- `waafi_config.update`
- `waafi_config.test`
- `payments.online_process`
- `payments.manual_create`
- `payments.status_check`
- `member_credentials.view`
- `member_credentials.resend_email`
- `trainer_credentials.view`
- `trainer_credentials.resend_email`

## Settings

The settings module includes:

- General Settings: site name, logos, icon, favicon, and login logo.
- Site Appearance: theme mode, primary color, sidebar style, layout width, and header style.
- Email Configuration: mail driver, sender identity, SMTP host, port, username, password, and encryption.
- Firebase Config: enable flag, project ID, client email, private key, and server key.
- Firebase Test Connection: validates Firebase Admin SDK credentials with an FCM dry-run send.
- Waafi Config: enable flag, test/live mode, API base URL, merchant UID, API user ID, hidden API key, and merchant number.
- Waafi Test Connection: phone number with `252` prefix, user-entered amount, server-side Waafi request, up to 90 seconds of wait time for the customer phone response, and raw Waafi response display.

Sensitive Waafi API keys are never returned to the frontend. The UI only receives whether an API key is configured.

## Email and Credentials

- The system uses the existing Email Configuration settings for real SMTP sending.
- Member welcome email templates include login email/phone, generated temporary password, and change-password reminder.
- Trainer welcome email templates include the same mobile login credential details.
- Admin password reset emails send a short-lived reset code.
- Member/trainer creation does not rollback if email is missing or SMTP sending fails.
- Temporary passwords are stored as hashes for login and encrypted fallback values for privileged admin viewing.
- Credential viewing and welcome-email resend are protected by dedicated Access Control permissions.

## Mobile APIs

Dedicated mobile auth routes are separate from the admin NextAuth flow:

- `POST /api/mobile/auth/login`
- `GET /api/mobile/auth/me`
- `POST /api/mobile/auth/logout`
- `POST /api/mobile/auth/forgot-password`
- `POST /api/mobile/auth/reset-password`

Mobile auth supports member and trainer accounts created by the admin panel. It returns a mobile token, role, and safe profile payload, and it accepts phone login identifiers in common local/international formats such as `061...`, `61...`, and `25261...`.

Member mobile areas include:

- Dashboard and current account summary.
- Active plans, current subscription, subscription history, renew, and upgrade.
- Waafi payment initiation/status and payment history.
- Notifications list, mark read, mark all read, and delete.
- Assigned workouts and schedules, including today's training.

Trainer mobile areas include:

- Trainer-only login, logout, change password, forgot/reset password.
- Profile view/update.
- Dashboard KPIs and today's schedule.
- Assigned members and member attendance/workouts/schedules.
- Trainer groups and group members/workouts/schedules.
- Attendance summaries for today, weekly, and monthly windows.
- Workout image upload.
- Workout CRUD, assign-to-member, and assign-to-group.
- Schedule CRUD, complete, and cancel.

## Push Notifications

- Mobile apps register FCM tokens through `POST /api/mobile/device-tokens` after login.
- Member devices subscribe to the `members` topic.
- Trainer devices subscribe to the `trainers` topic.
- Admin-created notifications attempt Firebase push after the notification record is saved.
- Settings includes a Firebase dry-run test button to validate service-account credentials before sending live pushes.
- Member notification APIs support list, mark one read, mark all read, and delete.

## WaafiPay Flow

- Somalia phone numbers are normalized to international `252...` format.
- Supported providers: EVC PLUS, JEEB, ZAAD, and SAHAL.
- Waafi payloads are built server-side.
- API keys stay server-side and are never exposed in client responses.
- Test Connection sends a real configured Waafi request for the entered phone and amount.
- Waafi endpoint URLs are normalized before use, so accidental pasted prefixes do not redirect the request away from Waafi.
- Online payment attempts are saved.
- Failed attempts are stored with failure reason and raw response.
- Waafi response ID, order ID, response message, failure reason, request ID, invoice ID, and raw response are visible from payment records.
- Successful payments can activate subscriptions and create confirmation notifications.
- Manual payments continue to work even when WaafiPay is disabled.

## API Areas

For a complete method-by-method API guide, read `API_END_TO_END_OVERVIEW.md`.

Admin and shared API areas:

- `/api/v1/dashboard`
- `/api/v1/members`
- `/api/v1/members/[id]/login-details`
- `/api/v1/members/[id]/resend-welcome-email`
- `/api/v1/trainers`
- `/api/v1/trainers/[id]/login-details`
- `/api/v1/trainers/[id]/resend-welcome-email`
- `/api/v1/trainers/[id]/reset-password`
- `/api/v1/trainers/[id]/account`
- `/api/v1/trainers/[id]/members`
- `/api/v1/membership-plans`
- `/api/v1/subscriptions`
- `/api/v1/payments`
- `/api/v1/payments/manual`
- `/api/v1/payments/waafi/initiate`
- `/api/v1/payments/waafi/status/[paymentId]`
- `/api/v1/attendance`
- `/api/v1/notifications`
- `/api/v1/reports/[report]`
- `/api/v1/reports/[report]/export`
- `/api/v1/bulk-delete`
- `/api/v1/access-control/*`
- `/api/v1/settings/waafi-config`
- `/api/v1/settings/waafi-config/test`
- `/api/v1/uploads/image`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`

Mobile API areas:

- `/api/mobile/auth/*`
- `/api/mobile/device-tokens`
- `/api/mobile/member/dashboard`
- `/api/mobile/member/plans`
- `/api/mobile/member/subscription/*`
- `/api/mobile/member/payments/*`
- `/api/mobile/member/notifications/*`
- `/api/mobile/member/workouts/*`
- `/api/mobile/member/schedules/*`
- `/api/mobile/trainer/auth/*`
- `/api/mobile/trainer/dashboard`
- `/api/mobile/trainer/profile`
- `/api/mobile/trainer/members/*`
- `/api/mobile/trainer/groups/*`
- `/api/mobile/trainer/attendance/[period]`
- `/api/mobile/trainer/uploads/image`
- `/api/mobile/trainer/workouts/*`
- `/api/mobile/trainer/schedules/*`

## Environment Variables

Create a `.env` file with:

```env
DATABASE_URL=
NEXTAUTH_SECRET=
SUPERADMIN_FIRST_NAME=
SUPERADMIN_LAST_NAME=
SUPERADMIN_EMAIL=
SUPERADMIN_PASSWORD=
```

WaafiPay and Firebase credentials are managed from the protected Settings page and stored in the global settings record.

## Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Push Prisma schema to PostgreSQL:

```bash
npm run db:push
```

Build for production:

```bash
npm run build
```

Start production build:

```bash
npm run start
```

Optional Docker run:

```bash
docker compose up --build app
```

The compose file exposes the app on `127.0.0.1:3010` and stores uploads in a named Docker volume.

Optional database push through Docker:

```bash
docker compose --profile tools run --rm db-push
```

## Data Model Summary

For a detailed database guide, read `DATABASE_END_TO_END_OVERVIEW.md`.

The Prisma schema includes:

- Access users, roles, permissions, role permissions, user roles, settings, and activity logs.
- Members, trainers, membership plans, subscriptions, payments, attendance, and notifications.
- Mobile accounts linked to members/trainers, encrypted temporary password fallback, and password reset code storage.
- Mobile device tokens for Firebase Cloud Messaging.
- Trainer groups, group memberships, workouts, and trainer schedules.
- Admin password reset code storage for Access Control users.
- Payment fields for manual and online flows, including currency, payment type, method, provider, phone number, reference ID, invoice ID, request ID, transaction ID, paid date, failure reason, and raw Waafi response.

## Uploads

Uploaded image files are stored locally under:

```text
public/uploads/access-control
public/uploads/workouts
```

The app exposes uploaded assets through the existing Next.js public file serving path.

## Verification

Recent verification includes:

- `npm run build`
- `npm run db:push`
- Authenticated settings save
- Safe settings responses without Waafi API key exposure
- Manual payment creation
- Disabled WaafiPay failed-attempt persistence
- Waafi Test Connection request and response handling
- Admin forgot/reset password routes compile in production build
- Member/trainer credential endpoints compile in production build
- Mobile auth endpoints compile in production build
