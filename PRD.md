# Gym Admin Panel Integration Plan

## Current Codebase

The existing codebase already includes:

* Next.js App Router
* Protected Super Admin dashboard
* NextAuth authentication
* Role and permission based access control
* Users, Roles, Permissions, Settings, Activity Logs
* Prisma + PostgreSQL
* Sidebar navigation
* shadcn/ui components
* Toasts, validation, loading states
* Local image uploads

This means the gym system should be integrated as new modules inside the existing admin dashboard.

---

# Integration Goal

Convert the current Next.js admin panel into a complete Gym Management Admin Panel.

The admin panel should manage:

1. Dashboard
2. Members
3. Membership Plans
4. Subscriptions
5. Payments
6. Attendance
7. Notifications
8. Reports
9. Trainers
10. Settings

Access Control should remain as an existing system module.

---

# Main Admin Sidebar Structure

The sidebar should contain:

## Main

1. Dashboard
2. Members
3. Membership Plans
4. Subscriptions
5. Payments
6. Attendance
7. Notifications
8. Reports

## Gym Management

9. Trainers

## System

10. Access Control

    * Settings
    * Users
    * Roles
    * Permissions
    * Activity Logs

11. System Settings

---

# Module 1: Dashboard

## Purpose

The dashboard gives the administrator a quick overview of the gym.

## Dashboard Cards

Show:

* Total Members
* Active Subscriptions
* Expired Subscriptions
* Pending Payments
* Today Attendance
* Monthly Revenue
* Total Trainers
* Recent Notifications

## Dashboard Tables

Add:

* Recent Members
* Recent Payments
* Expiring Subscriptions
* Today Attendance

---

# Module 2: Member Management

## Purpose

The administrator manages gym members.

## Features

* Add new member
* Edit member
* Delete member
* View member details
* Search members
* Filter members by status
* View subscription status
* View payment history
* View attendance history

## Member Fields

* Full name
* Phone number
* Email
* Gender
* Address
* Date of birth
* Emergency contact
* Profile image
* Account status

## Member Status

* Active
* Pending
* Suspended
* Expired

## Important Rule

Members do not register themselves from the mobile app.
The admin creates the member account from the admin panel.

---

# Module 3: Membership Plan Management

## Purpose

The administrator creates and manages gym plans.

## Features

* Add plan
* Edit plan
* Delete plan
* Activate/deactivate plan
* Set price
* Set duration
* Add plan description

## Plan Fields

* Plan name
* Plan type
* Duration
* Price
* Description
* Status

## Plan Types

* Monthly
* Quarterly
* Annual
* Group Training
* Personal Training

---

# Module 4: Subscription Management

## Purpose

The administrator manages member subscriptions.

## Features

* Assign subscription to member
* Renew subscription
* Upgrade subscription
* Suspend subscription
* View active subscriptions
* View expired subscriptions
* View pending subscriptions

## Subscription Fields

* Member
* Plan
* Start date
* Expiry date
* Status
* Payment status

## Subscription Status

* Active
* Expired
* Pending
* Suspended

## Important Rule

A subscription becomes active only when payment is confirmed.

---

# Module 5: Payment Management

## Purpose

The system supports two payment methods:

1. Admin manual payment
2. Member online payment through Waafi API / EVC

---

## Admin Manual Payment

This is used when the admin registers a member or renews a subscription from the admin panel.

### Flow

Admin logs in
→ Opens Members
→ Adds new member
→ Selects membership plan
→ Adds manual payment
→ Confirms payment
→ Subscription becomes active
→ Member can log in to mobile app

### Manual Payment Methods

* Cash
* EVC manual confirmation
* Bank transfer
* Other manual mobile money confirmation

### Manual Payment Fields

* Member
* Subscription
* Plan
* Amount
* Payment method
* Payment date
* Payment status
* Reference number
* Notes

---

## Member Online Payment

This will be used later in the mobile app.

### Flow

Member logs in
→ Opens Subscription
→ Clicks Renew or Upgrade
→ Selects plan
→ Chooses Waafi / EVC payment
→ Payment request is sent to Waafi API
→ Member confirms payment
→ System receives confirmation
→ Subscription updates automatically

### Online Payment Fields

* Member
* Subscription
* Plan
* Amount
* Transaction ID
* Payment provider
* Payment status
* Payment date

## Payment Status

* Paid
* Pending
* Failed
* Cancelled

---

# Module 6: Attendance Management

## Purpose

The admin tracks member attendance.

## Features

* Manual attendance check-in
*
* View today attendance
* View member attendance history
* Filter attendance by date
* Generate attendance report

## Attendance Fields

* Member
* Check-in date
*
*
* Status

## Attendance Methods

* Manual
*

---

# Module 7: Notification Management

## Purpose

The admin sends notifications to members.

## Features

* Send announcement
* Send payment reminder
* Send subscription expiry reminder
* Send upgrade confirmation
* View sent notifications

## Notification Types

* Payment Reminder
* Subscription Expiry
* Gym Announcement
* Upgrade Confirmation
* General Message

## Notification Fields

* Title
* Message
* Type
* Target member or all members
* Read status
* Created date

---

# Module 8: Reports

## Purpose

The admin views gym performance reports.

## Reports

* Member report
* Subscription report
* Payment report
* Attendance report
* Revenue report

## Features

* Filter by date
* Filter by member
* Filter by status
* Export report later pdf excel 

---

# Module 9: Trainer Management

## Purpose

The admin manages trainers.

## Features

* Add trainer
* Edit trainer
* Delete trainer
* View trainer profile
* Assign trainer to members later
* Assign trainer to groups later

## Trainer Fields

* Full name
* Phone number
* Email
* Gender
* Specialty
* Availability
* Status

---

# Access Control Integration

The existing Access Control module should protect the new gym modules.

## Suggested Permissions

Members:

* members.view
* members.create
* members.update
* members.delete

Plans:

* plans.view
* plans.create
* plans.update
* plans.delete

Subscriptions:

* subscriptions.view
* subscriptions.create
* subscriptions.update
* subscriptions.delete

Payments:

* payments.view
* payments.create
* payments.update
* payments.delete

Attendance:

* attendance.view
* attendance.create
* attendance.update
* attendance.delete

Notifications:

* notifications.view
* notifications.create
* notifications.delete

Reports:

* reports.view
* reports.export

Trainers:

* trainers.view
* trainers.create
* trainers.update
* trainers.delete

---

# Recommended Development Order

## Step 1

Add Prisma models for gym modules:

* Member
* Trainer
* MembershipPlan
* Subscription
* Payment
* Attendance
* Notification

## Step 2

Create CRUD APIs for:

* Members
* Plans
* Subscriptions
* Payments
* Attendance
* Notifications
* Trainers

## Step 3

Add sidebar navigation items.

## Step 4

Create admin pages:

* Dashboard
* Members
* Plans
* Subscriptions
* Payments
* Attendance
* Notifications
* Reports
* Trainers

## Step 5

Connect each page to API using SWR.

## Step 6

Add permission checks using the existing Access Control system.

## Step 7

Add activity logs for important actions.

Examples:

* Member created
* Subscription renewed
* Payment confirmed
* Member suspended
* Notification sent

---

# Final System Rule

The current Next.js admin panel remains the base system.

The gym modules should be added inside the existing protected admin dashboard.

The admin panel manages the gym.

The mobile member app will only allow:

1. Login
2. Forgot password
3. Dashboard
4. Subscription status and upgrade
5. Notifications
