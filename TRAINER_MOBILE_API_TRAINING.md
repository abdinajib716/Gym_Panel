# Trainer Management + Mobile API Training Guide

Production base URL: `https://gym.mrk.so`

Base trainer mobile URL: `https://gym.mrk.so/api/mobile/trainer`

Member mobile URL for assigned training content: `https://gym.mrk.so/api/mobile/member`

Admin trainer URL: `https://gym.mrk.so/api/v1/trainers`

Local development base URL used during smoke testing: `http://127.0.0.1:3020`

This guide explains the end-to-end trainer flow: Super Admin creates and manages trainers, trainers log in from the mobile app, trainers create workouts and schedules, and members see their assigned workout/schedule in the member mobile app.

## 1. What This Module Solves

The trainer module now supports two connected areas:

1. Super Admin trainer management
   - Create, edit, delete, and view trainers.
   - Assign members to trainers.
   - View trainer details, assigned members, workouts, schedules, groups, and mobile account status.
   - Reset trainer login password and send/copy temporary login details.
   - Block or unblock trainer mobile login.

2. Trainer mobile app workflow
   - Trainer logs in using a dedicated trainer mobile endpoint.
   - Trainer dashboard shows KPIs, assigned members, groups, and today schedule.
   - Trainer can view member attendance.
   - Trainer can upload workout images.
   - Trainer can create workouts and assign them to one member or one trainer group.
   - Trainer can create schedules and assign them to one member or one trainer group.
   - Member mobile app can list assigned workouts and today schedules.

## 2. Roles and Access Rules

All trainer mobile endpoints require a trainer mobile token:

```http
Authorization: Bearer <trainer_mobile_token>
Content-Type: application/json
```

Important rules:

- A member token cannot access trainer endpoints.
- A trainer token cannot access member-only mobile endpoints.
- A trainer can only access members assigned to that trainer.
- A trainer can only access groups, workouts, and schedules owned by that trainer.
- A workout or schedule must target exactly one assigned member or exactly one trainer group.
- Inactive trainers cannot use the trainer mobile API.

## 3. Super Admin Flow

### 3.1 Create or Update Trainer

Use the existing admin Trainer module.

Trainer fields:

- Full name
- Phone number
- Email
- Gender
- Specialty
- Availability
- Status

When a trainer email, phone, or status changes, the linked mobile login account is synced.

### 3.2 View Trainer Details

```http
GET /api/v1/trainers/{trainerId}
```

Returns:

- Trainer profile
- Assigned members
- Trainer groups
- Workouts created by trainer
- Schedules created by trainer
- Mobile account status
- Last login / login metadata, without password hash

### 3.3 Assign Member to Trainer

```http
POST /api/v1/trainers/{trainerId}/members
```

Request:

```json
{
  "memberId": "member_id"
}
```

Response:

```json
{
  "member": {},
  "message": "Member assigned to trainer successfully"
}
```

### 3.4 Remove Member from Trainer

```http
DELETE /api/v1/trainers/{trainerId}/members
```

Request:

```json
{
  "memberId": "member_id"
}
```

### 3.5 Reset Trainer Password

```http
POST /api/v1/trainers/{trainerId}/reset-password
```

Response:

```json
{
  "temporaryPassword": "generated_password",
  "emailStatus": "sent",
  "message": "Password reset and login details emailed"
}
```

If email is not configured or fails, Super Admin can copy the temporary password from the response/details.

### 3.6 Block or Unblock Trainer Login

```http
PUT /api/v1/trainers/{trainerId}/account
```

Request:

```json
{
  "status": "ACTIVE"
}
```

Allowed values:

- `ACTIVE`
- `INACTIVE`
- `SUSPENDED`

## 4. Trainer Authentication

### 4.1 Login

```http
POST /api/mobile/trainer/auth/login
```

Request:

```json
{
  "identifier": "trainer@example.com",
  "password": "temporary_or_current_password"
}
```

`identifier` can be email or phone depending on the mobile account login data.

Response:

```json
{
  "success": true,
  "token": "trainer_mobile_token",
  "role": "TRAINER",
  "trainer": {
    "id": "trainer_id",
    "fullName": "Trainer Name",
    "phoneNumber": "0612345678",
    "email": "trainer@example.com",
    "specialty": "Strength Training",
    "availability": "Mon-Fri 8AM-4PM"
  }
}
```

### 4.2 Logout

```http
POST /api/mobile/trainer/auth/logout
```

### 4.3 Change Password

```http
POST /api/mobile/trainer/auth/change-password
```

Use this after the trainer receives a temporary password.

## 5. Trainer Dashboard

```http
GET /api/mobile/trainer/dashboard
```

Response:

```json
{
  "success": true,
  "welcome": "Welcome Trainer Name",
  "trainer": {
    "id": "trainer_id",
    "name": "Trainer Name",
    "specialty": "Strength Training"
  },
  "kpis": {
    "total_members": 12,
    "total_groups": 2,
    "today_sessions": 3,
    "upcoming_sessions": 10,
    "completed_sessions": 22,
    "missed_sessions": 1
  },
  "recent_members": [],
  "today_schedule": []
}
```

Mobile dashboard should show:

- Welcome trainer message
- Total assigned members
- Today schedule
- Recent assigned members
- Upcoming/completed/missed sessions

## 6. Trainer Profile

### 6.1 Get Profile

```http
GET /api/mobile/trainer/profile
```

### 6.2 Update Profile

```http
PUT /api/mobile/trainer/profile
```

Request:

```json
{
  "fullName": "Trainer Name",
  "phoneNumber": "0612345678",
  "email": "trainer@example.com",
  "gender": "MALE",
  "specialty": "Strength Training",
  "availability": "Mon-Fri 8AM-4PM",
  "profileImage": "/uploads/access-control/trainer.webp"
}
```

## 7. Assigned Members

### 7.1 List Assigned Members

```http
GET /api/mobile/trainer/members
```

Optional search:

```http
GET /api/mobile/trainer/members?search=ahmed
```

Returns members assigned to the authenticated trainer only.

### 7.2 Member Details

```http
GET /api/mobile/trainer/members/{memberId}
```

Returns:

- Member profile
- Subscription history
- Recent attendance
- Recent workouts
- Recent schedules
- Group memberships

### 7.3 Member Attendance

```http
GET /api/mobile/trainer/members/{memberId}/attendance
```

### 7.4 Member Workouts

```http
GET /api/mobile/trainer/members/{memberId}/workouts
```

### 7.5 Member Schedules

```http
GET /api/mobile/trainer/members/{memberId}/schedules
```

## 8. Trainer Groups

### 8.1 List Groups

```http
GET /api/mobile/trainer/groups
```

### 8.2 Create Group

```http
POST /api/mobile/trainer/groups
```

Request:

```json
{
  "name": "Morning Strength Group",
  "trainingDays": "Monday, Wednesday, Friday",
  "trainingTime": "08:00",
  "status": "ACTIVE",
  "memberIds": ["member_id_1", "member_id_2"]
}
```

Snake case aliases are also accepted:

```json
{
  "training_days": "Monday, Wednesday, Friday",
  "training_time": "08:00",
  "member_ids": ["member_id_1", "member_id_2"]
}
```

Rules:

- Every `memberId` must belong to the authenticated trainer.
- `memberIds` is optional; the trainer can create an empty group and add members later.

### 8.3 Group Details

```http
GET /api/mobile/trainer/groups/{groupId}
```

### 8.4 Update Group

```http
PUT /api/mobile/trainer/groups/{groupId}
```

Request can include any group fields:

```json
{
  "name": "Updated Morning Group",
  "trainingDays": "Tuesday, Thursday",
  "trainingTime": "07:30",
  "status": "ACTIVE"
}
```

### 8.5 Delete Group

```http
DELETE /api/mobile/trainer/groups/{groupId}
```

### 8.6 Group Members

```http
GET /api/mobile/trainer/groups/{groupId}/members
```

### 8.7 Add Members to Group

```http
POST /api/mobile/trainer/groups/{groupId}/members
```

Request for one member:

```json
{
  "memberId": "member_id"
}
```

Request for multiple members:

```json
{
  "memberIds": ["member_id_1", "member_id_2"]
}
```

Snake case aliases are accepted:

```json
{
  "member_id": "member_id"
}
```

### 8.8 Remove Member from Group

```http
DELETE /api/mobile/trainer/groups/{groupId}/members
```

Request:

```json
{
  "memberId": "member_id"
}
```

### 8.9 Group Workouts

```http
GET /api/mobile/trainer/groups/{groupId}/workouts
```

### 8.10 Group Schedules

```http
GET /api/mobile/trainer/groups/{groupId}/schedules
```

### 8.11 Assign Workout to Group

Create a new workout for a group:

```http
POST /api/mobile/trainer/workouts
```

```json
{
  "groupId": "group_id",
  "title": "Group Cardio",
  "description": "Treadmill intervals",
  "image": "/uploads/workouts/cardio.webp",
  "sets": 4,
  "reps": 10,
  "durationMinutes": 30,
  "difficulty": "INTERMEDIATE",
  "category": "Cardio",
  "status": "ACTIVE"
}
```

Assign an existing workout to a group:

```http
POST /api/mobile/trainer/workouts/{workoutId}/assign-group
```

```json
{
  "groupId": "group_id"
}
```

## 9. Attendance Summary

```http
GET /api/mobile/trainer/attendance/today
GET /api/mobile/trainer/attendance/weekly
GET /api/mobile/trainer/attendance/monthly
```

Response:

```json
{
  "success": true,
  "period": "today",
  "summary": {
    "total": 8,
    "present": 8,
    "cancelled": 0
  },
  "attendance": []
}
```

## 10. Workout Image Upload

Use this before creating a workout when the trainer wants to show an image in the member app.

```http
POST /api/mobile/trainer/uploads/image
Content-Type: multipart/form-data
Authorization: Bearer <trainer_mobile_token>
```

Form field:

```text
file=<image_file>
```

Rules:

- Allowed types: JPG, PNG, WEBP
- Max size: 5MB
- File is stored under `/public/uploads/workouts`

Response:

```json
{
  "success": true,
  "url": "/uploads/workouts/filename.webp",
  "fileName": "filename.webp"
}
```

Use the returned `url` as the workout `image`.

## 11. Workouts

Workout is the content the member sees: title, image, description, sets/reps/duration, difficulty, and category.

### 11.1 List Trainer Workouts

```http
GET /api/mobile/trainer/workouts
```

### 11.2 Create Workout for One Member

```http
POST /api/mobile/trainer/workouts
```

Request:

```json
{
  "memberId": "member_id",
  "title": "Chest Day",
  "description": "Bench press, incline press, cable fly",
  "image": "/uploads/workouts/chest.webp",
  "sets": 3,
  "reps": 12,
  "durationMinutes": 45,
  "difficulty": "BEGINNER",
  "category": "Strength",
  "status": "ACTIVE"
}
```

Snake case aliases are also accepted:

```json
{
  "member_id": "member_id",
  "duration_minutes": 45
}
```

### 11.3 Create Workout for One Group

```http
POST /api/mobile/trainer/workouts
```

Request:

```json
{
  "groupId": "group_id",
  "title": "Group Cardio",
  "description": "Treadmill intervals and bodyweight finisher",
  "image": "/uploads/workouts/cardio.webp",
  "sets": 4,
  "reps": 10,
  "durationMinutes": 30,
  "difficulty": "INTERMEDIATE",
  "category": "Cardio",
  "status": "ACTIVE"
}
```

Important: send either `memberId` or `groupId`, not both.

### 11.4 Get Workout Detail

```http
GET /api/mobile/trainer/workouts/{workoutId}
```

### 11.5 Update Workout

```http
PUT /api/mobile/trainer/workouts/{workoutId}
```

Request can include any workout fields:

```json
{
  "title": "Updated Chest Day",
  "description": "Updated notes",
  "status": "ACTIVE"
}
```

### 11.6 Delete Workout

```http
DELETE /api/mobile/trainer/workouts/{workoutId}
```

### 11.7 Assign Existing Workout to Member

```http
POST /api/mobile/trainer/workouts/{workoutId}/assign-member
```

Request:

```json
{
  "memberId": "member_id"
}
```

### 11.8 Assign Existing Workout to Group

```http
POST /api/mobile/trainer/workouts/{workoutId}/assign-group
```

Request:

```json
{
  "groupId": "group_id"
}
```

Allowed workout values:

- `difficulty`: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`
- `status`: `ACTIVE`, `INACTIVE`

When a workout is assigned, the system creates a member notification with type `WORKOUT_ASSIGNED`.

## 12. Training Schedules

Schedule is the calendar/session plan for a member or group. It links to a workout.

### 12.1 List Schedules

```http
GET /api/mobile/trainer/schedules
```

Optional date filter:

```http
GET /api/mobile/trainer/schedules?date=2026-07-01
```

### 12.2 Create Schedule for One Member

```http
POST /api/mobile/trainer/schedules
```

Request:

```json
{
  "memberId": "member_id",
  "workoutId": "workout_id",
  "date": "2026-07-01",
  "startTime": "09:00",
  "endTime": "10:00",
  "notes": "Focus on correct form",
  "status": "UPCOMING"
}
```

### 12.3 Create Schedule for One Group

```http
POST /api/mobile/trainer/schedules
```

Request:

```json
{
  "groupId": "group_id",
  "workoutId": "workout_id",
  "date": "2026-07-01",
  "startTime": "18:00",
  "endTime": "19:00",
  "notes": "Bring water",
  "status": "UPCOMING"
}
```

Snake case aliases are accepted:

```json
{
  "group_id": "group_id",
  "workout_id": "workout_id",
  "start_time": "18:00",
  "end_time": "19:00"
}
```

Important: send either `memberId` or `groupId`, not both.

### 12.4 Get Schedule Detail

```http
GET /api/mobile/trainer/schedules/{scheduleId}
```

### 12.5 Update Schedule

```http
PUT /api/mobile/trainer/schedules/{scheduleId}
```

Request can include any schedule fields:

```json
{
  "date": "2026-07-02",
  "startTime": "10:00",
  "endTime": "11:00",
  "notes": "Rescheduled by trainer"
}
```

### 12.6 Delete Schedule

```http
DELETE /api/mobile/trainer/schedules/{scheduleId}
```

### 12.7 Mark Schedule Complete

```http
POST /api/mobile/trainer/schedules/{scheduleId}/complete
```

### 12.8 Cancel Schedule

```http
POST /api/mobile/trainer/schedules/{scheduleId}/cancel
```

Allowed schedule values:

- `UPCOMING`
- `COMPLETED`
- `MISSED`
- `CANCELLED`

When a schedule is assigned, the system creates a member notification with type `SCHEDULE_ASSIGNED`.

## 13. Member Mobile App Training Content

Members see trainer-created workouts and schedules through member mobile endpoints.

### 13.1 List Assigned Workouts

```http
GET /api/mobile/member/workouts
```

Returns active workouts assigned directly to the member or to any trainer group where the member belongs.

### 13.2 Today Workout Cards

```http
GET /api/mobile/member/workouts/today
```

This endpoint is best for the mobile home screen. It returns today schedule mapped as workout cards:

```json
{
  "success": true,
  "today_workouts": [
    {
      "id": "workout_id",
      "title": "Chest Day",
      "image": "/uploads/workouts/chest.webp",
      "description": "Bench press, incline press, cable fly",
      "sets": 3,
      "reps": 12,
      "durationMinutes": 45,
      "schedule": {
        "id": "schedule_id",
        "date": "2026-07-01T00:00:00.000Z",
        "startTime": "09:00",
        "endTime": "10:00",
        "status": "UPCOMING"
      },
      "trainer": {
        "id": "trainer_id",
        "fullName": "Trainer Name"
      }
    }
  ]
}
```

### 13.3 Workout Detail

```http
GET /api/mobile/member/workouts/{workoutId}
```

### 13.4 List Assigned Schedules

```http
GET /api/mobile/member/schedules
```

### 13.5 Today Schedules

```http
GET /api/mobile/member/schedules/today
```

## 14. Recommended Mobile Screen Flow

Trainer mobile app:

1. Login
2. If temporary password is active, ask trainer to change password
3. Dashboard
4. Members list
5. Member details
6. Upload workout image if needed
7. Create workout and assign to member/group
8. Create schedule using that workout
9. Track attendance and schedule status

Member mobile app:

1. Login
2. Dashboard/home
3. Call `/api/mobile/member/workouts/today`
4. Show workout card with title, image, trainer, time, sets/reps/duration
5. Call `/api/mobile/member/schedules/today` for calendar/session list
6. Show notifications for new workout and schedule assignments

## 15. Database Models Added

The trainer workflow depends on these Prisma additions:

- `TrainerGroup`
- `TrainerGroupMember`
- `Workout`
- `TrainerSchedule`
- `WorkoutDifficulty`
- `WorkoutStatus`
- `TrainerScheduleStatus`
- Notification types:
  - `WORKOUT_ASSIGNED`
  - `SCHEDULE_ASSIGNED`

Run database sync/migration before testing:

```bash
npm ci
npx prisma format
npx prisma generate
npx prisma db push
```

Use a proper migration instead of `db push` if the production deployment requires versioned migrations.

## 16. Quick End-to-End Test

1. Super Admin creates a trainer.
2. Super Admin assigns at least one member to that trainer.
3. Super Admin resets trainer password and shares login details.
4. Trainer logs in:

```http
POST /api/mobile/trainer/auth/login
```

5. Trainer uploads image:

```http
POST /api/mobile/trainer/uploads/image
```

6. Trainer creates workout:

```http
POST /api/mobile/trainer/workouts
```

7. Trainer creates schedule for that workout:

```http
POST /api/mobile/trainer/schedules
```

8. Member opens mobile app and sees today workout:

```http
GET /api/mobile/member/workouts/today
```

9. Member receives assignment notifications:

- `WORKOUT_ASSIGNED`
- `SCHEDULE_ASSIGNED`

## 17. Common Errors

### Trainer access required

The token is missing, expired, or belongs to a member account.

### Trainer is inactive

The trainer profile status is not `ACTIVE`.

### Choose exactly one assigned member or group

The request sent both `memberId` and `groupId`, or sent neither.

### Assigned member not found

The member is not assigned to this trainer.

### Assigned group not found

The group does not belong to this trainer.

### Workout not found

The workout does not belong to this trainer.

## 18. Developer Notes

- Keep trainer mobile endpoints under `/api/mobile/trainer`.
- Keep member training visibility under `/api/mobile/member`.
- Keep Super Admin trainer controls under `/api/v1/trainers`.
- Do not create a second conflicting endpoint prefix for the same trainer flow.
- Mobile API responses follow the existing project shape: success responses include `success: true`; errors return `{ "error": "Message" }`.
- Password hashes must never be exposed in API responses.
