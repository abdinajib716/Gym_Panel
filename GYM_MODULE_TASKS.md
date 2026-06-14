# Gym Management Integration Task List

Created: 2026-06-11
Last updated: 2026-06-12

## Status Legend

- [ ] Not started
- [~] In progress
- [x] Complete

## Environment Setup

- [x] Created `.env`.
- [x] Added `DATABASE_URL`.
- [x] Added `NEXTAUTH_SECRET`.
- [x] Added `SUPERADMIN_FIRST_NAME`.
- [x] Added `SUPERADMIN_LAST_NAME`.
- [x] Added `SUPERADMIN_EMAIL`.
- [x] Added `SUPERADMIN_PASSWORD`.

## Codebase Review

- [x] Read PRD.md end to end.
- [x] Reviewed current Next.js App Router structure under `app`.
- [x] Reviewed protected dashboard shell: `app/(dashboard)/layout.tsx`, `components/layout/admin`, and `components/admin/starter-shell.tsx`.
- [x] Reviewed authentication and route protection: `lib/auth.ts`, `proxy.ts`, `app/api/auth/[...nextauth]/route.ts`.
- [x] Reviewed existing Access Control, roles, permissions, and activity log patterns.
- [x] Reviewed Prisma schema and PostgreSQL setup.
- [x] Reviewed SWR data layer and client API helper.
- [x] Reviewed shadcn/ui, Tailwind, form, dialog, sheet, table, loading, and toast conventions.

## Integration Guardrails

- [x] Did not rebuild authentication.
- [x] Did not rebuild layout or dashboard shell.
- [x] Did not rebuild sidebar foundation.
- [x] Did not rebuild roles, permissions, settings, or Access Control.
- [x] Added gym features as protected pages inside the existing dashboard route group.
- [x] Reused Prisma, PostgreSQL, NextAuth, SWR, Tailwind, shadcn/ui, Zod, and activity logs.
- [x] Kept Access Control as the system module and extended its permission registry for gym features.
- [x] Kept all module APIs under `/api/v1`.
- [x] Used existing UI patterns: `StarterShell`, page headers, toolbars, tables, sheets, alert dialogs, skeletons, and toasts.

## Existing Patterns Reused

- [x] Protected pages added under `app/(dashboard)`.
- [x] Page wrappers use `StarterShell`.
- [x] Navigation extended in `lib/navigation.ts` and `components/admin/starter-shell.tsx`.
- [x] Route protection extended in `proxy.ts`.
- [x] API handlers call `requirePermission("<module>.<action>")`.
- [x] API handlers use `withErrorHandling`.
- [x] Gym validation schemas added in `lib/validations/gym.ts`.
- [x] Typed SWR hooks added in `lib/swr/hooks/gym.ts`.
- [x] Mutations use `apiRequest` and `toast`.
- [x] Important mutations call `createActivityLog`.

## Global Implementation Phases

- [x] Phase 1: Added Prisma gym models and enums.
- [x] Phase 2: Added gym validation schemas.
- [x] Phase 3: Seeded gym permissions into existing Access Control seed.
- [x] Phase 4: Added protected API routes for each gym module.
- [x] Phase 5: Added SWR hooks and shared gym types.
- [x] Phase 6: Added sidebar navigation for Main, Gym Management, and System groups.
- [x] Phase 7: Added protected dashboard pages and client components.
- [x] Phase 8: Replaced mock dashboard with real gym data endpoint and UI.
- [x] Phase 9: Added activity logs for important gym actions.
- [x] Phase 10: Ran Prisma generate, database push, and build verification.

## Prisma Models

- [x] Added `Member`.
- [x] Added `Trainer`.
- [x] Added `MembershipPlan`.
- [x] Added `Subscription`.
- [x] Added `Payment`.
- [x] Added `Attendance`.
- [x] Added `Notification`.
- [x] Added enums for statuses, types, methods, targets, and read states.
- [x] Added relations between members, plans, subscriptions, payments, attendance records, notifications, and trainers.
- [x] Added indexes for search and filtering fields.

## Permissions Seeded

- [x] `members.view`
- [x] `members.create`
- [x] `members.update`
- [x] `members.delete`
- [x] `plans.view`
- [x] `plans.create`
- [x] `plans.update`
- [x] `plans.delete`
- [x] `subscriptions.view`
- [x] `subscriptions.create`
- [x] `subscriptions.update`
- [x] `subscriptions.delete`
- [x] `payments.view`
- [x] `payments.create`
- [x] `payments.update`
- [x] `payments.delete`
- [x] `attendance.view`
- [x] `attendance.create`
- [x] `attendance.update`
- [x] `attendance.delete`
- [x] `notifications.view`
- [x] `notifications.create`
- [x] `notifications.delete`
- [x] `reports.view`
- [x] `reports.export`
- [x] `trainers.view`
- [x] `trainers.create`
- [x] `trainers.update`
- [x] `trainers.delete`

## Sidebar And Protected Routes

- [x] Main: Dashboard.
- [x] Main: Members.
- [x] Main: Membership Plans.
- [x] Main: Subscriptions.
- [x] Main: Payments.
- [x] Main: Attendance.
- [x] Main: Notifications.
- [x] Main: Reports.
- [x] Gym Management: Trainers.
- [x] System: Access Control group with Settings, Users, Roles, Permissions, Activity Logs.
- [x] System Settings mapped to existing Access Control settings page.
- [x] Updated `proxy.ts` to protect all new gym routes and enforce view permissions.

## Module 1: Dashboard

- [x] Route: `app/(dashboard)/dashboard/page.tsx`.
- [x] API: `GET /api/v1/dashboard`.
- [x] SWR: dashboard summary hook.
- [x] Cards: Total Members.
- [x] Cards: Active Subscriptions.
- [x] Cards: Expired Subscriptions.
- [x] Cards: Pending Payments.
- [x] Cards: Today Attendance.
- [x] Cards: Monthly Revenue.
- [x] Cards: Total Trainers.
- [x] Cards: Recent Notifications.
- [x] Tables: Recent Members.
- [x] Tables: Recent Payments.
- [x] Tables: Expiring Subscriptions.
- [x] Tables: Today Attendance.
- [x] Permission: protected through existing permission system.
- [x] Module complete.

## Module 2: Members

- [x] Route: `app/(dashboard)/members/page.tsx`.
- [x] API: `GET /api/v1/members`.
- [x] API: `POST /api/v1/members`.
- [x] API: `GET /api/v1/members/[id]`.
- [x] API: `PUT /api/v1/members/[id]`.
- [x] API: `DELETE /api/v1/members/[id]`.
- [x] UI: list, search, status filter, pagination.
- [x] UI: add member sheet.
- [x] UI: add member sheet includes membership plan and manual payment onboarding.
- [x] UI: edit member sheet.
- [x] UI: delete confirmation.
- [x] UI: member details view.
- [x] UI: subscription status section.
- [x] UI: payment history section through full detail drawer.
- [x] UI: attendance history section through full detail drawer.
- [x] Fields: full name, phone number, email, gender, address, date of birth, emergency contact, profile image, account status.
- [x] Status values: Active, Pending, Suspended, Expired.
- [x] Rule: admin creates members, members do not self-register.
- [x] Rule: creating a member with a paid manual payment creates an active subscription.
- [x] Activity logs: member created, updated, deleted, suspended.
- [x] E2E verified: member onboarding creates member, subscription, and payment together.
- [x] Module complete.

## Module 3: Membership Plans

- [x] Route: `app/(dashboard)/membership-plans/page.tsx`.
- [x] API: `GET /api/v1/membership-plans`.
- [x] API: `POST /api/v1/membership-plans`.
- [x] API: `GET /api/v1/membership-plans/[id]`.
- [x] API: `PUT /api/v1/membership-plans/[id]`.
- [x] API: `DELETE /api/v1/membership-plans/[id]`.
- [x] UI: list, search, status filter, pagination.
- [x] UI: add plan sheet.
- [x] UI: edit plan sheet.
- [x] UI: activate/deactivate action.
- [x] UI: delete confirmation.
- [x] Fields: plan name, plan type, duration, price, description, status.
- [x] Plan types: Monthly, Quarterly, Annual, Group Training, Personal Training.
- [x] Activity logs: plan created, updated, activated, deactivated, deleted.
- [x] Module complete.

## Module 4: Subscriptions

- [x] Route: `app/(dashboard)/subscriptions/page.tsx`.
- [x] API: `GET /api/v1/subscriptions`.
- [x] API: `POST /api/v1/subscriptions`.
- [x] API: `GET /api/v1/subscriptions/[id]`.
- [x] API: `PUT /api/v1/subscriptions/[id]`.
- [x] API: `DELETE /api/v1/subscriptions/[id]`.
- [x] UI: list active, expired, pending, suspended subscriptions.
- [x] UI: assign subscription to member.
- [x] UI: renew subscription via edit flow.
- [x] UI: upgrade subscription via edit flow.
- [x] UI: suspend subscription via edit flow.
- [x] Fields: member, plan, start date, expiry date, status, payment status.
- [x] Rule: subscription becomes active only when payment is confirmed.
- [x] Activity logs: assigned, renewed, upgraded, suspended, deleted.
- [x] Module complete.

## Module 5: Payments

- [x] Route: `app/(dashboard)/payments/page.tsx`.
- [x] API: `GET /api/v1/payments`.
- [x] API: `POST /api/v1/payments`.
- [x] API: `GET /api/v1/payments/[id]`.
- [x] API: `PUT /api/v1/payments/[id]`.
- [x] API: `DELETE /api/v1/payments/[id]`.
- [x] UI: list, search, status filter, method filter, pagination.
- [x] UI: add manual payment sheet.
- [x] UI: edit payment sheet.
- [x] UI: confirm payment flow by setting status to Paid.
- [x] Manual methods: Cash, EVC manual confirmation, Bank transfer, Other manual mobile money confirmation.
- [x] Manual fields: member, subscription, plan, amount, payment method, payment date, payment status, reference number, notes.
- [x] Online fields reserved: transaction ID, provider, payment status, payment date.
- [x] Status values: Paid, Pending, Failed, Cancelled.
- [x] Rule: confirming payment activates linked subscription.
- [x] Activity logs: payment created, confirmed, updated, deleted.
- [x] Module complete.

## Module 6: Attendance

- [x] Route: `app/(dashboard)/attendance/page.tsx`.
- [x] API: `GET /api/v1/attendance`.
- [x] API: `POST /api/v1/attendance`.
- [x] API: `GET /api/v1/attendance/[id]`.
- [x] API: `PUT /api/v1/attendance/[id]`.
- [x] API: `DELETE /api/v1/attendance/[id]`.
- [x] UI: manual check-in.
- [x] UI: today attendance available on dashboard.
- [x] UI: member attendance history through member detail drawer.
- [x] UI: status filter and report filters.
- [x] UI: attendance report view.
- [x] Fields: member, check-in date, method, status.
- [x] Method: Manual.
- [x] Activity logs: check-in created, updated, deleted.
- [x] Module complete.

## Module 7: Notifications

- [x] Route: `app/(dashboard)/notifications/page.tsx`.
- [x] API: `GET /api/v1/notifications`.
- [x] API: `POST /api/v1/notifications`.
- [x] API: `GET /api/v1/notifications/[id]`.
- [x] API: `DELETE /api/v1/notifications/[id]`.
- [x] UI: sent notifications list.
- [x] UI: send announcement.
- [x] UI: send payment reminder.
- [x] UI: send subscription expiry reminder.
- [x] UI: send upgrade confirmation.
- [x] Fields: title, message, type, target member or all members, read status, created date.
- [x] Types: Payment Reminder, Subscription Expiry, Gym Announcement, Upgrade Confirmation, General Message.
- [x] Activity logs: notification sent, deleted.
- [x] Module complete.

## Module 8: Reports

- [x] Route: `app/(dashboard)/reports/page.tsx`.
- [x] API: `GET /api/v1/reports/members`.
- [x] API: `GET /api/v1/reports/subscriptions`.
- [x] API: `GET /api/v1/reports/payments`.
- [x] API: `GET /api/v1/reports/attendance`.
- [x] API: `GET /api/v1/reports/revenue`.
- [x] UI: member report.
- [x] UI: subscription report.
- [x] UI: payment report.
- [x] UI: attendance report.
- [x] UI: revenue report.
- [x] Filters: date range.
- [x] Filters: member-ready API support.
- [x] Filters: status.
- [x] Export: placeholder action reserved behind `reports.export`.
- [x] Module complete.

## Module 9: Trainers

- [x] Route: `app/(dashboard)/trainers/page.tsx`.
- [x] API: `GET /api/v1/trainers`.
- [x] API: `POST /api/v1/trainers`.
- [x] API: `GET /api/v1/trainers/[id]`.
- [x] API: `PUT /api/v1/trainers/[id]`.
- [x] API: `DELETE /api/v1/trainers/[id]`.
- [x] UI: list, search, status filter, pagination.
- [x] UI: add trainer sheet.
- [x] UI: edit trainer sheet.
- [x] UI: trainer profile view.
- [x] UI: delete confirmation.
- [x] Fields: full name, phone number, email, gender, specialty, availability, status.
- [x] Later: trainer assignment support included through optional member `trainerId`.
- [x] Activity logs: trainer created, updated, deleted.
- [x] Module complete.

## Verification Checklist

- [x] `npm run build`.
- [x] `npm run db:push`.
- [x] Prisma client generated.
- [x] Protected gym pages configured in `proxy.ts`.
- [x] View-permission redirects configured in `proxy.ts`.
- [x] CRUD API endpoints call `requirePermission`.
- [x] Dashboard and tables include loading and empty states.
- [x] Mutations show toast feedback and refresh SWR data.
- [x] Activity logs record important gym actions.
- [x] Existing Access Control pages remain present.
- [x] Existing settings and branding routes remain present.

## Module 10: System Settings Deep Dive

- [x] Review and stabilize General Settings, Site Appearance, and Email Configuration tabs.
- [x] Fix save behavior across all existing settings tabs.
- [x] Fix appearance changes causing layout flicker/lag.
- [x] Make Layout Width setting actually affect the admin shell.
- [x] Remove redundant settings UI behavior where possible.
- [x] Add Firebase Config tab for notification configuration.
- [x] Add Waafi Config tab for WaafiPay credentials and behavior.
- [x] Add activity logs when Firebase or Waafi settings are created or updated.
- [x] Module complete.

## Module 11: WaafiPay Configuration

- [x] Add Waafi Config fields: enabled, environment mode, API base URL, merchant UID, API user ID, API key, merchant number.
- [x] Hide API key in the UI.
- [x] Never expose API key to frontend responses.
- [x] Add Test Connection action.
- [x] Test Connection includes phone field prefixed with `252` and local number input.
- [x] Support test/live mode switching.
- [x] Add permissions: `waafi_config.view`, `waafi_config.update`, `waafi_config.test`.
- [x] Add permissions: `payments.online_process`, `payments.manual_create`, `payments.status_check`.
- [x] Module complete.

## Module 12: WaafiPay Backend

- [x] Update payment schema/model to support manual and online payment fields.
- [x] Add payment types: Manual and Online.
- [x] Add Waafi providers: EVC PLUS, JEEB, ZAAD, SAHAL.
- [x] Add Somalia phone normalization.
- [x] Add Waafi service layer.
- [x] Add payment service layer.
- [x] Add config routes: `GET /api/v1/settings/waafi-config`, `PUT /api/v1/settings/waafi-config`, `POST /api/v1/settings/waafi-config/test`.
- [x] Add online payment routes: `POST /api/v1/payments/waafi/initiate`, `GET /api/v1/payments/waafi/status/[paymentId]`.
- [x] Add manual payment route: `POST /api/v1/payments/manual`.
- [x] Ensure online payment only works when WaafiPay is enabled.
- [x] Ensure manual payment works even when WaafiPay is disabled.
- [x] Save every payment attempt.
- [x] Activate subscription only after successful payment.
- [x] Create notifications after payment success or failure.
- [x] Module complete.

## Latest Verification

- [x] `npm run build`.
- [x] `npm run db:push`.
- [x] Authenticated settings API saves and returns safe settings.
- [x] General settings API does not expose `waafiApiKey`.
- [x] Waafi config API returns `waafiApiKeyConfigured` without exposing the secret.
- [x] Waafi test action returns `400` while WaafiPay is disabled.
- [x] Manual payment API creates a paid payment while WaafiPay is disabled.
- [x] Disabled WaafiPay online attempt is saved as a failed `WAAFI_PAY` payment.
- [x] Shared pagination defaults fixed for list APIs called without `page`.
- [x] Settings route no longer runs access-control seed during read/save.
- [x] Settings form no longer uses root-level `form.watch()` subscriptions.
- [x] Settings save updates SWR cache without forcing a re-fetch/reset.
- [x] Authenticated Site Appearance save returned `200` without seed-stack error.
- [x] Waafi Test Connection includes a user-entered amount.
- [x] Waafi Test Connection returns request details and raw Waafi API response.
- [x] Waafi Test Connection shows failed Waafi responses as error feedback.
- [x] README replaced with Gym Management Admin Panel tech stack and end-to-end feature documentation.
- [x] Waafi API URL is normalized before requests and config display.
- [x] Existing malformed Waafi API URL was saved back as `https://api.waafipay.net/asm`.
- [x] Waafi payload includes documented `description` field and UUID request ID.
- [x] Waafi Test Connection waits up to 90 seconds for the customer phone response.
- [x] Build no longer depends on remote Google font downloads.
- [x] Waafi Test Connection toast shows Waafi `responseMsg`, including wrong PIN messages.
- [x] Waafi online payments store response ID, order ID, response message, failure reason, and raw response.
- [x] Payments list and detail drawer show Waafi transaction lifecycle fields end to end.

## Phase 2: Dedicated Mobile API Guardrails

- [x] Read Phase 2 mobile API brief end to end from pasted requirements.
- [x] Confirmed existing admin routes and mobile routes must stay separated.
- [x] Confirmed admin routes continue to manage the system.
- [x] Confirmed mobile routes only expose trainer/member self-scoped data.
- [x] Do not change existing admin authentication, layout, sidebar, roles, permissions, settings, Access Control, or gym CRUD behavior unless a mobile requirement explicitly needs shared data support.
- [x] Keep mobile APIs under `/api/mobile/*`.
- [x] Add mobile-specific auth/session/token handling without replacing existing NextAuth admin flow.
- [ ] Add mobile validation schemas separately from admin CRUD validation where payloads differ.
- [x] Add mobile response shaping so apps receive simple, safe payloads.
- [~] Add tests or smoke checks for mobile authorization boundaries.

## Module 13: Mobile Data Model Preparation

- [x] Review current Prisma models against mobile requirements.
- [x] Decide whether trainers and members need mobile login credentials on existing `Trainer` and `Member` records or a separate mobile account table.
- [x] Plan password reset token/code storage.
- [ ] Plan trainer workout models.
- [ ] Plan workout exercise model.
- [ ] Plan workout assignment model.
- [ ] Plan trainer/member progress note model.
- [ ] Plan trainer schedule/session model if current plan/subscription data is not enough.
- [ ] Plan notification targeting for trainer recipients.
- [x] Add Prisma changes only after plan is confirmed.
- [x] Run `npm run db:push` only after schema changes are approved.

## Prerequisite: Welcome Emails, Credentials, and Admin Password Reset

- [x] Read welcome email and credential brief end to end.
- [x] Add real SMTP mail service using existing Email Configuration.
- [x] Add member welcome email template.
- [x] Add trainer welcome email template.
- [x] Add admin password reset email template.
- [x] Add mobile login account storage linked to members/trainers.
- [x] Generate secure temporary passwords for member/trainer accounts.
- [x] Store password hashes for future mobile login.
- [x] Store temporary password fallback encrypted.
- [x] Set `mustChangePassword` for generated accounts.
- [x] Create member mobile login account after admin creates member.
- [x] Create trainer mobile login account after admin creates trainer.
- [x] Send welcome email when member/trainer has email.
- [x] Do not rollback member/trainer creation if welcome email fails.
- [x] Add credential view permissions.
- [x] Add credential resend email permissions.
- [x] Add member login details endpoint.
- [x] Add trainer login details endpoint.
- [x] Add member resend welcome email endpoint.
- [x] Add trainer resend welcome email endpoint.
- [x] Add Login Details fallback section to View Details.
- [x] Add Show Password button for temporary password fallback.
- [x] Add Copy Login Details button.
- [x] Add Resend Welcome Email button.
- [x] Add admin Forgot Password link on sign-in page.
- [x] Add admin forgot-password API.
- [x] Add admin reset-password API.
- [x] Run `npm run db:push`.
- [x] Run `npm run build`.

## Module 14: Shared Mobile Auth API

- [x] Route: `POST /api/mobile/auth/login`.
- [x] Route: `POST /api/mobile/auth/forgot-password`.
- [x] Route: `POST /api/mobile/auth/reset-password`.
- [x] Route: `POST /api/mobile/auth/logout`.
- [x] Route: `GET /api/mobile/auth/me`.
- [x] Support trainer login by phone/email and password.
- [x] Support member login by phone/email and password.
- [x] Return mobile token, role, and safe user profile.
- [x] Ensure disabled/inactive/suspended users cannot log in.
- [x] Ensure mobile auth does not alter admin NextAuth behavior.
- [x] Normalize mobile login phone identifiers across `061...`, `61...`, and `25261...` formats.
- [x] Module complete.

## Module 15: Member Mobile API

- [x] Route: `GET /api/mobile/member/dashboard`.
- [x] Route: `GET /api/mobile/member/subscription/current`.
- [x] Route: `GET /api/mobile/member/subscription/history`.
- [x] Route: `GET /api/mobile/member/plans`.
- [x] Route: `POST /api/mobile/member/subscription/upgrade`.
- [x] Route: `POST /api/mobile/member/subscription/renew`.
- [x] Route: `POST /api/mobile/member/payments/waafi/initiate`.
- [x] Route: `GET /api/mobile/member/payments/waafi/status/:paymentId`.
- [x] Route: `GET /api/mobile/member/payments/history`.
- [x] Route: `GET /api/mobile/member/notifications`.
- [x] Route: `PATCH /api/mobile/member/notifications/:notificationId/read`.
- [x] Member can only access own dashboard, subscription, payments, and notifications.
- [x] Member cannot register from mobile app.
- [x] Upgrade/renew creates pending subscription until payment succeeds.
- [x] Waafi payment uses existing server-side Waafi service and stores full transaction response.
- [x] Successful payment activates subscription and notifies member.
- [x] Failed payment stores Waafi failure reason and notifies member.
- [x] Created `MOBILE_MEMBER_API_CONTRACT.md`.
- [x] Captured exact member API smoke responses in `MOBILE_MEMBER_API_SMOKE_RESPONSES.md`.
- [x] Module complete.

## Module 16: Trainer Mobile API

- [ ] Route: `GET /api/mobile/trainer/dashboard`.
- [ ] Route: `GET /api/mobile/trainer/members`.
- [ ] Route: `GET /api/mobile/trainer/members/:memberId`.
- [ ] Route: `GET /api/mobile/trainer/members/:memberId/subscription`.
- [ ] Route: `GET /api/mobile/trainer/schedule/today`.
- [ ] Route: `GET /api/mobile/trainer/schedule`.
- [ ] Route: `GET /api/mobile/trainer/workouts`.
- [ ] Route: `POST /api/mobile/trainer/workouts`.
- [ ] Route: `GET /api/mobile/trainer/workouts/:workoutId`.
- [ ] Route: `PUT /api/mobile/trainer/workouts/:workoutId`.
- [ ] Route: `DELETE /api/mobile/trainer/workouts/:workoutId`.
- [ ] Route: `POST /api/mobile/trainer/workouts/:workoutId/assign-member`.
- [ ] Route: `GET /api/mobile/trainer/members/:memberId/workouts`.
- [ ] Route: `POST /api/mobile/trainer/members/:memberId/progress-note`.
- [ ] Route: `GET /api/mobile/trainer/members/:memberId/attendance`.
- [ ] Route: `GET /api/mobile/trainer/notifications`.
- [ ] Route: `PATCH /api/mobile/trainer/notifications/:notificationId/read`.
- [ ] Trainer can only access own profile.
- [ ] Trainer can only see assigned members.
- [ ] Trainer cannot view all gym members.
- [ ] Trainer cannot view member payment details.
- [ ] Trainer can only manage workouts created by himself.
- [ ] Trainer can only assign workouts to his assigned members.
- [ ] Module complete.

## Phase 2 Verification Checklist

- [x] `npm run build`.
- [x] `npm run db:push` if Prisma schema changes are added.
- [ ] Mobile auth login works for trainer.
- [x] Mobile auth login works for member.
- [x] Mobile `/me` returns only safe profile data.
- [~] E2E mobile login smoke was attempted, but the remote Neon database connection was unreachable during record creation.
- [ ] Trainer cannot access unassigned member.
- [ ] Trainer cannot access admin-only data.
- [ ] Member cannot access another member's data.
- [ ] Member Waafi payment stores request id, invoice id, transaction id, order id, response message, status, and raw response.
- [ ] Existing admin panel routes still work after mobile API changes.

## Latest Auth Fix Verification

- [x] Sign-in no longer runs Access Control seed before loading an existing user.
- [x] Session refresh keeps the existing JWT if the database is temporarily unavailable.
- [x] API error handler returns a clean database-unavailable message instead of raw Prisma/Turbopack stack output.
- [x] Forgot Password API returned the generic reset-code response successfully.
- [x] Credentials sign-in callback returned the dashboard URL successfully.
- [x] `npm run build`.

## Latest Member Detail UX Fix

- [x] Member View Details no longer shows raw database IDs for subscriptions, payments, and attendance.
- [x] Related records now use human labels such as Plan, Period, Amount, Payment Status, and Check-in Date.
- [x] Empty related sections show a plain no-records message.
- [x] `npm run build`.

## Latest Permission and Member Mobile API Fix

- [x] Super Admin now bypasses stale permission lists in `requirePermission`.
- [x] Show Password and Resend Welcome Email are no longer blocked for Super Admin by missing credential permissions.
- [x] Member mobile API endpoints implemented.
- [x] Member mobile API endpoints smoke-tested with a real mobile token.
- [x] Waafi initiate validation returns a clean client error without creating an admin activity-log foreign-key error.

## Latest Firebase Push Notification Integration

- [x] Checked current Firebase documentation for server-side FCM sending.
- [x] Installed Firebase Admin SDK.
- [x] Added `MobileDeviceToken` storage for member/trainer FCM tokens.
- [x] Added mobile device token registration/removal endpoint.
- [x] Added Firebase Config test button in Settings.
- [x] Added Firebase dry-run test endpoint.
- [x] Added role push support for `members` and `trainers` topics.
- [x] Admin notifications now attempt Firebase push after the notification is saved.
- [x] Added `ALL_TRAINERS` notification target.
- [x] Member notification APIs support list, mark one read, mark all read, and delete.
- [x] Mobile notification/device-token smoke test passed.
- [x] `npm run db:push`.
- [x] `npm run build`.
