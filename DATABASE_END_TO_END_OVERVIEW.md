# Gym Management Database End-to-End Overview

This document explains the database structure behind the Gym Management system in a friendly, practical way. It is based on `prisma/schema.prisma`.

The database uses:

- PostgreSQL
- Prisma ORM
- UUID string primary keys
- Decimal money fields for payments and plans
- Enum fields for statuses and controlled values
- `createdAt` and `updatedAt` timestamps on most business tables

## Big Picture

The database is organized into six main areas:

| Area | Main tables | What it stores |
| --- | --- | --- |
| Access Control | `AccessUser`, `AccessRole`, `AccessPermission`, joins, logs | Admin users, roles, permissions, audit logs. |
| Settings | `AccessControlSettings` | Branding, email, Firebase, and WaafiPay configuration. |
| Gym Core | `Member`, `Trainer`, `MembershipPlan`, `Subscription` | Members, trainers, plans, and active/past memberships. |
| Money | `Payment` | Manual and online payment records, including Waafi data. |
| Attendance and Messaging | `Attendance`, `Notification` | Member check-ins and member/trainer notifications. |
| Mobile and Training | `MobileAccount`, `MobileDeviceToken`, `TrainerGroup`, `Workout`, `TrainerSchedule` | Mobile login, push tokens, trainer groups, workouts, and schedules. |

## Database Provider

The Prisma datasource is:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

There is currently one schema file:

- `prisma/schema.prisma`

No Prisma migration folder is present in the repository; the README points to `npm run db:push` for pushing schema changes.

## Relationship Map

High-level relationship flow:

```text
AccessUser
  -> AccessUserRole -> AccessRole
  -> AccessActivityLog
  -> AccessPasswordReset

AccessRole
  -> AccessRolePermission -> AccessPermission

Member
  -> Trainer
  -> Subscription -> MembershipPlan
  -> Payment
  -> Attendance
  -> Notification
  -> MobileAccount
  -> TrainerGroupMember -> TrainerGroup
  -> Workout
  -> TrainerSchedule

Trainer
  -> Member
  -> MobileAccount
  -> TrainerGroup
  -> Workout
  -> TrainerSchedule

MobileAccount
  -> MobileDeviceToken
  -> MobilePasswordReset

Workout
  -> Trainer
  -> Member or TrainerGroup
  -> TrainerSchedule

TrainerSchedule
  -> Trainer
  -> Workout
  -> Member or TrainerGroup
```

## Access Control Tables

### `AccessUser`

Purpose: Admin panel user who can log into the protected dashboard.

Important fields:

| Field | Meaning |
| --- | --- |
| `id` | UUID primary key. |
| `avatarUrl` | Optional profile image. |
| `firstName`, `lastName`, `displayName` | Human identity fields. |
| `username` | Unique username. |
| `email` | Unique email used for admin login. |
| `passwordHash` | Hashed admin password. |
| `createdAt`, `updatedAt` | Audit timestamps. |

Relationships:

- Has many `AccessUserRole`
- Has many `AccessActivityLog` as actor
- Has many `AccessPasswordReset`

Delete behavior:

- Deleting an access user cascades their role links and password reset codes.
- Activity logs keep their record, but `userId` becomes `null`.

### `AccessRole`

Purpose: A named admin role such as Super Admin, Manager, or Auditor.

Important fields:

| Field | Meaning |
| --- | --- |
| `name` | Role name. |
| `guardName` | Guard namespace, default `web`. |

Constraints:

- Unique pair: `name + guardName`

Relationships:

- Has many `AccessUserRole`
- Has many `AccessRolePermission`

### `AccessPermission`

Purpose: A single permission key used by API guards, for example `members.view`.

Important fields:

| Field | Meaning |
| --- | --- |
| `name` | Permission key. |
| `guardName` | Guard namespace, default `web`. |
| `groupKey` | Permission group, such as `members`, `payments`, or `settings`. |

Constraints:

- Unique pair: `name + guardName`

### `AccessUserRole`

Purpose: Join table between admin users and roles.

Important fields:

| Field | Meaning |
| --- | --- |
| `userId` | Linked `AccessUser`. |
| `roleId` | Linked `AccessRole`. |

Constraints:

- Unique pair: `userId + roleId`

Delete behavior:

- Deleted when linked user or role is deleted.

### `AccessRolePermission`

Purpose: Join table between roles and permissions.

Important fields:

| Field | Meaning |
| --- | --- |
| `roleId` | Linked `AccessRole`. |
| `permissionId` | Linked `AccessPermission`. |

Constraints:

- Unique pair: `roleId + permissionId`

Delete behavior:

- Deleted when linked role or permission is deleted.

### `AccessActivityLog`

Purpose: Audit log for admin actions and important system events.

Important fields:

| Field | Meaning |
| --- | --- |
| `type` | Module/category, such as `members`, `payments`, `settings`. |
| `activity` | Human-readable action. |
| `subject` | Record or person affected. |
| `subjectId` | Optional id of affected record. |
| `userId` | Optional admin actor id. |
| `userDisplay` | Actor display name/email fallback. |
| `metadata` | Optional JSON details. |
| `createdAt` | Log time. |

Delete behavior:

- If the actor user is deleted, `userId` is set to `null` so the log still remains.

## Settings Table

### `AccessControlSettings`

Purpose: Stores global system settings. There is normally one row with `key = "global"`.

Important groups of fields:

| Field group | Fields |
| --- | --- |
| Branding | `siteName`, logos, favicon, login logo |
| Theme | `themeMode`, `primaryColor`, `sidebarStyle`, `layoutWidth`, `headerStyle` |
| Email | `mailDriver`, sender, SMTP host/port/username/password/encryption |
| Firebase | enable flag, project id, client email, private key, server key |
| WaafiPay | enable flag, environment, base URL, merchant UID, API user id, API key, merchant number |

Security note:

- `waafiApiKey`, SMTP password, Firebase private key, and similar fields are sensitive.
- API routes intentionally hide Waafi API key in safe responses.

## Mobile Auth Tables

### `MobileAccount`

Purpose: Login account for one member or one trainer.

Important fields:

| Field | Meaning |
| --- | --- |
| `role` | `MEMBER` or `TRAINER`. |
| `loginEmail`, `loginPhone` | Login identifiers. |
| `passwordHash` | Hashed mobile password. |
| `temporaryPasswordEncrypted` | Encrypted temporary password fallback for privileged admin viewing. |
| `mustChangePassword` | Whether user should change temporary password. |
| `passwordChangedAt` | Last password change time. |
| `lastLoginAt` | Last login time. |
| `accountStatus` | `ACTIVE`, `INACTIVE`, or `SUSPENDED`. |
| `welcomeEmailSentAt`, `welcomeEmailError` | Welcome email tracking. |
| `memberId` | Optional unique link to member. |
| `trainerId` | Optional unique link to trainer. |

Important rules:

- A mobile account belongs to either one member or one trainer.
- `memberId` is unique.
- `trainerId` is unique.

Delete behavior:

- If the linked member or trainer is deleted, the mobile account is deleted.
- Deleting the mobile account deletes its device tokens and reset codes.

Indexes:

- `role`
- `loginEmail`
- `loginPhone`
- `accountStatus`

### `MobileDeviceToken`

Purpose: Stores FCM device tokens for member/trainer push notifications.

Important fields:

| Field | Meaning |
| --- | --- |
| `accountId` | Linked `MobileAccount`. |
| `role` | Account role at registration time. |
| `token` | Unique FCM token. |
| `platform` | `ANDROID`, `IOS`, `WEB`, or `UNKNOWN`. |
| `deviceName` | Optional device label. |
| `topic` | Optional Firebase topic. |
| `lastSeenAt` | Last registration/update time. |

Delete behavior:

- Deleted when linked mobile account is deleted.

Indexes:

- `accountId`
- `role`
- `platform`
- `lastSeenAt`

### `MobilePasswordReset`

Purpose: Mobile password reset codes.

Important fields:

| Field | Meaning |
| --- | --- |
| `accountId` | Linked mobile account. |
| `codeHash` | Hashed reset code. |
| `expiresAt` | Expiry time. |
| `usedAt` | Set when code is consumed. |

Delete behavior:

- Deleted when linked mobile account is deleted.

### `AccessPasswordReset`

Purpose: Admin password reset codes.

Important fields:

| Field | Meaning |
| --- | --- |
| `userId` | Linked admin user. |
| `codeHash` | Hashed reset code. |
| `expiresAt` | Expiry time. |
| `usedAt` | Set when code is consumed. |

Delete behavior:

- Deleted when linked admin user is deleted.

## Gym Core Tables

### `Member`

Purpose: Main gym member profile.

Important fields:

| Field | Meaning |
| --- | --- |
| `fullName` | Member name. |
| `phoneNumber` | Member phone number. |
| `email` | Optional unique email. |
| `gender` | `MALE`, `FEMALE`, or `OTHER`. |
| `address`, `dateOfBirth`, `emergencyContact` | Optional profile details. |
| `profileImage` | Optional image URL. |
| `status` | `ACTIVE`, `PENDING`, `SUSPENDED`, or `EXPIRED`. |
| `trainerId` | Optional assigned trainer. |

Relationships:

- Belongs to optional `Trainer`
- Has many `Subscription`
- Has many `Payment`
- Has many `Attendance`
- Has many `Notification`
- Has one optional `MobileAccount`
- Has many `TrainerGroupMember`
- Has many `Workout`
- Has many `TrainerSchedule`

Delete behavior:

- Deleting a member deletes subscriptions, attendance, mobile account, group memberships, direct workouts, and direct trainer schedules.
- Payments are deleted because they belong to member with cascade.
- Notifications keep their record but `memberId` becomes `null`.

Indexes:

- `fullName`
- `phoneNumber`
- `status`
- `trainerId`

### `Trainer`

Purpose: Gym trainer profile.

Important fields:

| Field | Meaning |
| --- | --- |
| `fullName` | Trainer name. |
| `phoneNumber` | Trainer phone number. |
| `email` | Optional unique email. |
| `gender` | `MALE`, `FEMALE`, or `OTHER`. |
| `specialty` | Main trainer specialty. |
| `availability` | Optional availability text. |
| `status` | `ACTIVE` or `INACTIVE`. |

Relationships:

- Has many `Member`
- Has one optional `MobileAccount`
- Has many `TrainerGroup`
- Has many `Workout`
- Has many `TrainerSchedule`

Delete behavior:

- Assigned members remain, but their `trainerId` becomes `null`.
- Trainer groups remain, but their `trainerId` becomes `null`.
- Trainer mobile account is deleted.
- Trainer workouts and schedules are deleted.

Indexes:

- `fullName`
- `status`

### `MembershipPlan`

Purpose: A sellable plan/package for member subscriptions.

Important fields:

| Field | Meaning |
| --- | --- |
| `name` | Plan name. |
| `type` | Plan category. |
| `durationDays` | Subscription length in days. |
| `price` | Decimal price, two decimal places. |
| `description` | Optional text. |
| `status` | `ACTIVE` or `INACTIVE`. |

Relationships:

- Has many `Subscription`
- Has many `Payment`

Delete behavior:

- A plan cannot be deleted if subscriptions still reference it because subscription uses `onDelete: Restrict`.
- Payments keep their row but `planId` becomes `null` if the linked plan is deleted.

Indexes:

- `name`
- `type`
- `status`

### `Subscription`

Purpose: A member's plan assignment and membership validity period.

Important fields:

| Field | Meaning |
| --- | --- |
| `memberId` | Linked member. |
| `planId` | Linked membership plan. |
| `startDate` | Subscription start date. |
| `expiryDate` | Subscription expiry date. |
| `status` | `ACTIVE`, `EXPIRED`, `PENDING`, or `SUSPENDED`. |
| `paymentStatus` | `PAID`, `PENDING`, `FAILED`, `CANCELLED`, or `EXPIRED`. |

Relationships:

- Belongs to `Member`
- Belongs to `MembershipPlan`
- Has many `Payment`

Delete behavior:

- Deleted when member is deleted.
- Cannot remain if linked plan is deleted because plan deletion is restricted.
- Payments remain but `subscriptionId` becomes `null` when subscription is deleted.

Indexes:

- `memberId`
- `planId`
- `status`
- `paymentStatus`
- `expiryDate`

## Money Table

### `Payment`

Purpose: Stores both manual payments and online WaafiPay attempts.

Important fields:

| Field | Meaning |
| --- | --- |
| `memberId` | Member who paid. |
| `subscriptionId` | Optional linked subscription. |
| `planId` | Optional linked plan. |
| `amount` | Decimal amount, two decimal places. |
| `currency` | Defaults to `USD`. |
| `paymentType` | `MANUAL` or `ONLINE`. |
| `method` | Cash, bank, manual mobile money, Waafi, etc. |
| `onlineProvider` | Waafi provider enum when online. |
| `status` | Payment status. |
| `paymentDate` | When payment was created/recorded. |
| `paidAt` | When payment was confirmed paid. |
| `reference`, `referenceId`, `invoiceId`, `requestId`, `transactionId` | Tracking fields. |
| `phoneNumber`, `provider` | Online/mobile money details. |
| `failedReason` | Failure reason when payment fails. |
| `rawResponse` | JSON copy of remote Waafi response or failure metadata. |

Relationships:

- Belongs to `Member`
- Optionally belongs to `Subscription`
- Optionally belongs to `MembershipPlan`

Delete behavior:

- Deleted when member is deleted.
- Keeps row with `subscriptionId = null` if subscription is deleted.
- Keeps row with `planId = null` if plan is deleted.

Indexes:

- `memberId`
- `subscriptionId`
- `planId`
- `status`
- `method`
- `paymentType`
- `onlineProvider`
- `requestId`
- `paymentDate`

## Attendance and Notification Tables

### `Attendance`

Purpose: Member check-in history.

Important fields:

| Field | Meaning |
| --- | --- |
| `memberId` | Checked-in member. |
| `checkInDate` | Check-in datetime. |
| `method` | Currently `MANUAL`. |
| `status` | `PRESENT` or `CANCELLED`. |

Delete behavior:

- Deleted when member is deleted.

Indexes:

- `memberId`
- `checkInDate`
- `status`

### `Notification`

Purpose: Stores messages sent by admin or generated by system events.

Important fields:

| Field | Meaning |
| --- | --- |
| `title` | Notification title. |
| `message` | Notification body. |
| `type` | Notification category. |
| `target` | `ALL_MEMBERS`, `ALL_TRAINERS`, or `SINGLE_MEMBER`. |
| `memberId` | Optional target member for single-member notifications. |
| `readStatus` | `UNREAD` or `READ`. |

Delete behavior:

- If linked member is deleted, notification remains but `memberId` becomes `null`.

Indexes:

- `type`
- `target`
- `memberId`
- `readStatus`
- `createdAt`

## Trainer Mobile Training Tables

### `TrainerGroup`

Purpose: A trainer-owned group of members for group workouts/schedules.

Important fields:

| Field | Meaning |
| --- | --- |
| `name` | Group name. |
| `trainingDays` | Optional text for days. |
| `trainingTime` | Optional text for time. |
| `status` | Uses `TrainerStatus`: `ACTIVE` or `INACTIVE`. |
| `trainerId` | Optional owner trainer. |

Relationships:

- Belongs to optional `Trainer`
- Has many `TrainerGroupMember`
- Has many `Workout`
- Has many `TrainerSchedule`

Delete behavior:

- If trainer is deleted, group remains with `trainerId = null`.
- If group is deleted, its group memberships, group workouts, and group schedules are deleted.

Indexes:

- `trainerId`
- `status`

### `TrainerGroupMember`

Purpose: Join table between trainer groups and members.

Important fields:

| Field | Meaning |
| --- | --- |
| `groupId` | Linked group. |
| `memberId` | Linked member. |

Constraints:

- Unique pair: `groupId + memberId`

Delete behavior:

- Deleted when linked group or member is deleted.

Indexes:

- `memberId`

### `Workout`

Purpose: Workout content created by a trainer for either one member or one group.

Important fields:

| Field | Meaning |
| --- | --- |
| `trainerId` | Trainer who owns the workout. |
| `memberId` | Optional direct member target. |
| `groupId` | Optional group target. |
| `title` | Workout title. |
| `description` | Optional instructions. |
| `image` | Optional image URL. |
| `sets`, `reps`, `durationMinutes` | Optional workout metrics. |
| `difficulty` | `BEGINNER`, `INTERMEDIATE`, or `ADVANCED`. |
| `category` | Optional category label. |
| `status` | `ACTIVE` or `INACTIVE`. |

Important rule from API layer:

- A workout should target exactly one member or exactly one group. The database allows nullable fields, and the API enforces the one-target rule.

Relationships:

- Belongs to `Trainer`
- Optionally belongs to `Member`
- Optionally belongs to `TrainerGroup`
- Has many `TrainerSchedule`

Delete behavior:

- Deleted when trainer, direct member, or group is deleted.
- Deleting a workout deletes linked trainer schedules.

Indexes:

- `trainerId`
- `memberId`
- `groupId`
- `status`

### `TrainerSchedule`

Purpose: Calendar/session record linked to a workout.

Important fields:

| Field | Meaning |
| --- | --- |
| `trainerId` | Trainer who owns the schedule. |
| `memberId` | Optional direct member target. |
| `groupId` | Optional group target. |
| `workoutId` | Linked workout. |
| `date` | Session date. |
| `startTime`, `endTime` | Session time range as text. |
| `notes` | Optional trainer notes. |
| `status` | `UPCOMING`, `COMPLETED`, `MISSED`, or `CANCELLED`. |

Important rule from API layer:

- A schedule should target exactly one member or exactly one group.
- The linked workout must belong to the same trainer.

Relationships:

- Belongs to `Trainer`
- Optionally belongs to `Member`
- Optionally belongs to `TrainerGroup`
- Belongs to `Workout`

Delete behavior:

- Deleted when trainer, direct member, group, or workout is deleted.

Indexes:

- `trainerId`
- `memberId`
- `groupId`
- `workoutId`
- `date`
- `status`

## Enums

### Identity and Status

| Enum | Values |
| --- | --- |
| `Gender` | `MALE`, `FEMALE`, `OTHER` |
| `MemberStatus` | `ACTIVE`, `PENDING`, `SUSPENDED`, `EXPIRED` |
| `TrainerStatus` | `ACTIVE`, `INACTIVE` |
| `MobileAccountRole` | `MEMBER`, `TRAINER` |
| `MobileAccountStatus` | `ACTIVE`, `INACTIVE`, `SUSPENDED` |
| `MobileDevicePlatform` | `ANDROID`, `IOS`, `WEB`, `UNKNOWN` |

### Plans, Subscriptions, and Payments

| Enum | Values |
| --- | --- |
| `PlanType` | `MONTHLY`, `QUARTERLY`, `ANNUAL`, `GROUP_TRAINING`, `PERSONAL_TRAINING` |
| `PlanStatus` | `ACTIVE`, `INACTIVE` |
| `SubscriptionStatus` | `ACTIVE`, `EXPIRED`, `PENDING`, `SUSPENDED` |
| `PaymentStatus` | `PAID`, `PENDING`, `FAILED`, `CANCELLED`, `EXPIRED` |
| `PaymentMethod` | `CASH`, `MANUAL_EVC`, `EVC_MANUAL`, `BANK_TRANSFER`, `OTHER_MANUAL_MOBILE_MONEY`, `WAAFI_PAY`, `WAAFI`, `EVC_ONLINE` |
| `PaymentType` | `MANUAL`, `ONLINE` |
| `OnlinePaymentProvider` | `EVC_PLUS`, `JEEB`, `ZAAD`, `SAHAL` |

### Attendance, Notifications, Training

| Enum | Values |
| --- | --- |
| `AttendanceMethod` | `MANUAL` |
| `AttendanceStatus` | `PRESENT`, `CANCELLED` |
| `NotificationType` | `PAYMENT_REMINDER`, `SUBSCRIPTION_EXPIRY`, `GYM_ANNOUNCEMENT`, `UPGRADE_CONFIRMATION`, `GENERAL_MESSAGE`, `WORKOUT_ASSIGNED`, `SCHEDULE_ASSIGNED` |
| `NotificationTarget` | `ALL_MEMBERS`, `ALL_TRAINERS`, `SINGLE_MEMBER` |
| `NotificationReadStatus` | `UNREAD`, `READ` |
| `WorkoutDifficulty` | `BEGINNER`, `INTERMEDIATE`, `ADVANCED` |
| `WorkoutStatus` | `ACTIVE`, `INACTIVE` |
| `TrainerScheduleStatus` | `UPCOMING`, `COMPLETED`, `MISSED`, `CANCELLED` |

## Important Business Rules

### Member Lifecycle

1. A member starts as `PENDING` unless created with a paid initial plan.
2. A member can be assigned to one trainer.
3. Creating a member also creates a linked mobile account in application logic.
4. A paid subscription/payment can activate the member.
5. Deleting a member removes most owned operational data, but notifications can remain as history with `memberId = null`.

### Trainer Lifecycle

1. A trainer starts as `ACTIVE` by default.
2. Creating a trainer also creates a linked mobile account in application logic.
3. Trainers can own groups, workouts, and schedules.
4. If a trainer is deleted, assigned members/groups are not deleted, but direct trainer-owned workouts and schedules are deleted.

### Subscription and Payment Lifecycle

1. A subscription links one member to one plan.
2. Payment status and subscription status move together in application logic.
3. A `PAID` payment activates the subscription and member.
4. Online Waafi payments store request ids, invoice ids, transaction ids, and raw responses for traceability.
5. Payments survive deleted subscriptions/plans by setting those foreign keys to `null`, but payments are deleted if the member is deleted.

### Trainer Content Lifecycle

1. Workouts and schedules always belong to a trainer.
2. Workouts and schedules can target one member or one group.
3. The API enforces target ownership and exactly-one-target rules.
4. Members see direct assignments and group assignments through the mobile API.

## Delete Behavior Summary

| Deleted record | What happens |
| --- | --- |
| `AccessUser` | User-role links and admin reset codes are deleted. Activity logs keep row with `userId = null`. |
| `AccessRole` | User-role links and role-permission links are deleted. |
| `AccessPermission` | Role-permission links are deleted. |
| `Member` | Subscriptions, payments, attendance, mobile account, group memberships, direct workouts, and direct schedules are deleted. Notifications keep row with `memberId = null`. |
| `Trainer` | Mobile account, workouts, and schedules are deleted. Members and groups keep row with `trainerId = null`. |
| `MembershipPlan` | Deletion is restricted if subscriptions reference it. Payments keep row with `planId = null`. |
| `Subscription` | Payments keep row with `subscriptionId = null`. |
| `MobileAccount` | Device tokens and mobile reset codes are deleted. |
| `TrainerGroup` | Group memberships, group workouts, and group schedules are deleted. |
| `Workout` | Linked schedules are deleted. |

## Index and Query Design

The schema adds indexes on fields commonly used by list screens and filters:

| Table | Indexed fields |
| --- | --- |
| `MobileAccount` | `role`, `loginEmail`, `loginPhone`, `accountStatus` |
| `MobileDeviceToken` | `accountId`, `role`, `platform`, `lastSeenAt` |
| `Member` | `fullName`, `phoneNumber`, `status`, `trainerId` |
| `Trainer` | `fullName`, `status` |
| `TrainerGroup` | `trainerId`, `status` |
| `TrainerGroupMember` | `memberId` |
| `Workout` | `trainerId`, `memberId`, `groupId`, `status` |
| `TrainerSchedule` | `trainerId`, `memberId`, `groupId`, `workoutId`, `date`, `status` |
| `MembershipPlan` | `name`, `type`, `status` |
| `Subscription` | `memberId`, `planId`, `status`, `paymentStatus`, `expiryDate` |
| `Payment` | `memberId`, `subscriptionId`, `planId`, `status`, `method`, `paymentType`, `onlineProvider`, `requestId`, `paymentDate` |
| `Attendance` | `memberId`, `checkInDate`, `status` |
| `Notification` | `type`, `target`, `memberId`, `readStatus`, `createdAt` |

## Sensitive Data Notes

The database stores sensitive information, so API responses should remain careful.

Sensitive fields include:

- `AccessUser.passwordHash`
- `MobileAccount.passwordHash`
- `MobileAccount.temporaryPasswordEncrypted`
- `AccessPasswordReset.codeHash`
- `MobilePasswordReset.codeHash`
- `AccessControlSettings.smtpPassword`
- `AccessControlSettings.firebasePrivateKey`
- `AccessControlSettings.firebaseServerKey`
- `AccessControlSettings.waafiApiKey`
- `Payment.rawResponse` if it contains provider-side details

Current application behavior already avoids exposing password hashes and hides Waafi API key in safe config responses.

## Practical Reading Guide

Use these mental shortcuts when reading the schema:

- Admin access starts at `AccessUser`.
- A permission check eventually depends on `AccessRolePermission`.
- Gym member money history starts at `Member -> Subscription -> Payment`.
- Mobile login starts at `MobileAccount`, not directly at `Member` or `Trainer`.
- Trainer content starts at `Trainer -> Workout -> TrainerSchedule`.
- Group content flows through `TrainerGroup -> TrainerGroupMember`.
- Push notification delivery depends on `MobileDeviceToken`, but notification history is stored in `Notification`.

## Files to Read Next

Related source files:

- `prisma/schema.prisma`
- `lib/access-control.ts`
- `lib/auth.ts`
- `lib/mobile-auth.ts`
- `lib/mobile-credentials.ts`
- `lib/mobile-member.ts`
- `lib/mobile-trainer.ts`
- `lib/payments/payment.service.ts`
- `lib/payments/waafi.service.ts`
