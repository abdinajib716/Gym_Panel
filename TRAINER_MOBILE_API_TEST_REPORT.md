# Trainer Mobile API Test Report

Test date: `2026-07-01`

Flutter/default base URL: `https://gym.mrk.so`

Local API test base URL: `http://127.0.0.1:3020`

Trainer tested:

- Name: Muscab Mowlidd
- Email: `najiibmaxamed716@gmail.com`
- Phone: `0619396766`
- Specialty: Full
- Status: ACTIVE
- Password/token: redacted

## Summary

Result: PASS

Production deployment result: PASS

`https://gym.mrk.so` has now been rebuilt/restarted with the backend version that passed local testing. The previously missing trainer mobile routes now return `200` in production.

The trainer mobile API login and protected endpoints returned `200`. The end-to-end trainer workflow was also tested with curl:

1. Login as trainer.
2. Read profile/dashboard/member/attendance data.
3. Upload a temporary workout image.
4. Create a workout for the assigned member.
5. Read, update, and assign the workout.
6. Create two schedules for the workout.
7. Read, update, complete, and cancel schedules.
8. Confirm the member resource endpoints show the workout/schedules.
9. Delete the temporary schedules and workout.
10. Remove the temporary uploaded image file.
11. Logout.

## Base URL / Flutter Launch Note

The Flutter app default base URL is:

```text
https://gym.mrk.so
```

However, the successful trainer API smoke test in this report was run against the current local backend:

```text
http://127.0.0.1:3020
```

Original deployment result before redeploy:

```http
POST https://gym.mrk.so/api/mobile/trainer/auth/login
```

Previous response: `404`

After redeploy, production now responds successfully.

Current production result:

```http
POST https://gym.mrk.so/api/mobile/trainer/auth/login
```

Current response: `200`

Flutter can now use the default production base URL for trainer APIs:

```text
https://gym.mrk.so
```

For local-only development, launch Flutter with a local/dev API base URL override that points to the backend running this code.

Example Flutter launch pattern:

```bash
flutter run --dart-define=API_BASE_URL=http://<backend-host>:3020
```

Use the correct host for the device:

- Android emulator: usually `http://10.0.2.2:3020`
- iOS simulator: usually `http://127.0.0.1:3020`
- Physical phone: use the computer LAN IP, for example `http://192.168.1.20:3020`

Production is now deployed, so this override is only needed for local development.

## Environment Notes

The already-running local servers on ports `3007` and `3010` returned HTML `404` for the new trainer routes, meaning those processes did not expose the current workspace code. For accurate testing, the current workspace was started with:

```bash
npx prisma generate
npm run dev -- -p 3020
```

## API Results

| # | Method | Endpoint | Status | Result | Notes |
|---:|---|---|---:|---|---|
| 1 | POST | `/api/mobile/trainer/auth/login` | 200 | PASS | Trainer login succeeded, token returned, `mustChangePassword: true` |
| 2 | GET | `/api/mobile/trainer/profile` | 200 | PASS | Trainer profile returned |
| 3 | GET | `/api/mobile/trainer/dashboard` | 200 | PASS | Dashboard returned; assigned members: 1, groups: 0, today sessions: 0 |
| 4 | GET | `/api/mobile/trainer/members` | 200 | PASS | Members returned: 1 |
| 5 | GET | `/api/mobile/trainer/groups` | 200 | PASS | Groups returned: 0 |
| 6 | GET | `/api/mobile/trainer/attendance/today` | 200 | PASS | Total attendance: 0 |
| 7 | GET | `/api/mobile/trainer/attendance/weekly` | 200 | PASS | Total attendance: 0 |
| 8 | GET | `/api/mobile/trainer/attendance/monthly` | 200 | PASS | Total attendance: 0 |
| 9 | GET | `/api/mobile/trainer/members/{memberId}` | 200 | PASS | Assigned member detail returned |
| 10 | GET | `/api/mobile/trainer/members/{memberId}/attendance` | 200 | PASS | Attendance returned: 0 |
| 11 | GET | `/api/mobile/trainer/members/{memberId}/workouts` | 200 | PASS | Before create: 0, after create: 1 |
| 12 | GET | `/api/mobile/trainer/members/{memberId}/schedules` | 200 | PASS | Before create: 0, after create: 2 |
| 13 | GET | `/api/mobile/trainer/workouts` | 200 | PASS | Workout list returned |
| 14 | POST | `/api/mobile/trainer/uploads/image` | 200 | PASS | Temporary PNG uploaded |
| 15 | POST | `/api/mobile/trainer/workouts` | 200 | PASS | Temporary workout created |
| 16 | GET | `/api/mobile/trainer/workouts/{workoutId}` | 200 | PASS | Workout detail returned |
| 17 | PUT | `/api/mobile/trainer/workouts/{workoutId}` | 200 | PASS | Workout updated |
| 18 | POST | `/api/mobile/trainer/workouts/{workoutId}/assign-member` | 200 | PASS | Workout assigned to member |
| 19 | GET | `/api/mobile/trainer/schedules` | 200 | PASS | Schedule list returned |
| 20 | GET | `/api/mobile/trainer/schedules?date=2026-07-01` | 200 | PASS | Date-filtered schedule list returned |
| 21 | POST | `/api/mobile/trainer/schedules` | 200 | PASS | Schedule created for complete-action test |
| 22 | GET | `/api/mobile/trainer/schedules/{scheduleId}` | 200 | PASS | Schedule detail returned |
| 23 | PUT | `/api/mobile/trainer/schedules/{scheduleId}` | 200 | PASS | Schedule updated |
| 24 | POST | `/api/mobile/trainer/schedules/{scheduleId}/complete` | 200 | PASS | Schedule status changed to `COMPLETED` |
| 25 | POST | `/api/mobile/trainer/schedules` | 200 | PASS | Schedule created for cancel-action test |
| 26 | POST | `/api/mobile/trainer/schedules/{scheduleId}/cancel` | 200 | PASS | Schedule status changed to `CANCELLED` |
| 27 | DELETE | `/api/mobile/trainer/schedules/{scheduleId}` | 200 | PASS | Temporary schedule deleted |
| 28 | DELETE | `/api/mobile/trainer/workouts/{workoutId}` | 200 | PASS | Temporary workout deleted |
| 29 | POST | `/api/mobile/trainer/auth/logout` | 200 | PASS | Logout returned success |

## Production Verification After Deploy

Base URL: `https://gym.mrk.so`

| Method | Endpoint | Status | Result |
|---|---|---:|---|
| POST | `/api/mobile/trainer/auth/login` | 200 | PASS |
| POST | `/api/mobile/auth/login` | 200 | PASS |
| GET | `/api/mobile/trainer/profile` | 200 | PASS |
| GET | `/api/mobile/trainer/dashboard` | 200 | PASS |
| GET | `/api/mobile/trainer/members` | 200 | PASS |
| GET | `/api/mobile/trainer/groups` | 200 | PASS |
| GET | `/api/mobile/trainer/workouts` | 200 | PASS |
| GET | `/api/mobile/trainer/schedules` | 200 | PASS |

Production data observed:

- Assigned members: 1
- Groups: 0
- Workouts: 0
- Schedules: 0

## Password Rotation

The exposed trainer temporary password was rotated after production verification.

Security verification:

- Old shared password now returns `401 Invalid login credentials`.
- New rotated temporary password works and still requires first-login password change.
- The new temporary password is stored encrypted and can be retrieved by Super Admin from trainer Login Details.

## Not Tested / Skipped

These were intentionally skipped:

- `POST /api/mobile/trainer/auth/change-password`
  - Reason: would change the provided trainer password.
- Forgot/reset password endpoints
  - Reason: email/password reset side effects.
- Group detail/group workout/group schedule endpoints
  - Reason: this trainer currently has `0` groups.
- `assign-group`
  - Reason: no trainer group exists for this trainer.
- Member mobile endpoints under `/api/mobile/member`
  - Reason: member mobile credentials were not provided in this test request.

## Cleanup

Temporary smoke-test data was removed:

- Created schedules were deleted.
- Created workout was deleted.
- Uploaded temporary workout image was removed from `public/uploads/workouts`.

No permanent workout or schedule test data was left behind.
