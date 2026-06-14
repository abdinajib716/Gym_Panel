# Mobile Member API Contract

Base URL: `/api/mobile`

All member endpoints require:

```http
Authorization: Bearer <mobile_token>
Content-Type: application/json
```

The token is returned by `POST /api/mobile/auth/login`. A trainer token cannot access member endpoints.

## Shared Response Rules

- Success responses include `success: true`.
- Error responses use the existing API shape: `{ "error": "Message" }`.
- All dates are ISO strings.
- Money values are numbers and use `USD` unless another currency is returned.
- Mobile responses never expose password hashes, admin-only IDs, or Access Control data.

## Member Dashboard

`GET /api/mobile/member/dashboard`

Response:

```json
{
  "success": true,
  "member": {
    "id": "member_id",
    "fullName": "Member Name",
    "phoneNumber": "0612345678",
    "email": "member@example.com",
    "status": "ACTIVE"
  },
  "account": {
    "accountId": "mobile_account_id",
    "mustChangePassword": true
  },
  "summary": {
    "hasActiveSubscription": true,
    "paymentCount": 3,
    "unreadNotifications": 1
  },
  "currentSubscription": null,
  "recentPayments": [],
  "latestNotifications": []
}
```

## Current Subscription

`GET /api/mobile/member/subscription/current`

Response:

```json
{
  "success": true,
  "subscription": {
    "id": "subscription_id",
    "plan": {
      "id": "plan_id",
      "name": "Monthly",
      "type": "MONTHLY",
      "durationDays": 30,
      "price": 30,
      "currency": "USD",
      "description": "Monthly access",
      "status": "ACTIVE"
    },
    "startDate": "2026-06-14T00:00:00.000Z",
    "expiryDate": "2026-07-14T00:00:00.000Z",
    "status": "ACTIVE",
    "paymentStatus": "PAID",
    "createdAt": "2026-06-14T00:00:00.000Z"
  }
}
```

If no active subscription exists, `subscription` is `null`.

## Subscription History

`GET /api/mobile/member/subscription/history`

Response:

```json
{
  "success": true,
  "subscriptions": []
}
```

## Active Plans

`GET /api/mobile/member/plans`

Response:

```json
{
  "success": true,
  "plans": [
    {
      "id": "plan_id",
      "name": "Monthly",
      "type": "MONTHLY",
      "durationDays": 30,
      "price": 30,
      "currency": "USD",
      "description": "Monthly access",
      "status": "ACTIVE"
    }
  ]
}
```

## Create Upgrade Request

`POST /api/mobile/member/subscription/upgrade`

Request:

```json
{
  "planId": "plan_id",
  "startDate": "2026-06-14"
}
```

Response:

```json
{
  "success": true,
  "message": "Upgrade request created. Complete payment to activate the subscription.",
  "subscription": {
    "id": "subscription_id",
    "plan": {},
    "startDate": "2026-06-14T00:00:00.000Z",
    "expiryDate": "2026-07-14T00:00:00.000Z",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "createdAt": "2026-06-14T00:00:00.000Z"
  },
  "paymentRequired": true
}
```

## Create Renewal Request

`POST /api/mobile/member/subscription/renew`

Request:

```json
{
  "planId": "optional_plan_id"
}
```

If `planId` is omitted, the latest subscription plan is reused.

Response:

```json
{
  "success": true,
  "message": "Renewal request created. Complete payment to activate the subscription.",
  "subscription": {},
  "paymentRequired": true
}
```

## Initiate Waafi Payment

`POST /api/mobile/member/payments/waafi/initiate`

Request:

```json
{
  "subscriptionId": "subscription_id",
  "provider": "EVC_PLUS",
  "phoneNumber": "252612345678",
  "amount": 30,
  "currency": "USD"
}
```

Allowed providers: `EVC_PLUS`, `JEEB`, `ZAAD`, `SAHAL`.

Response:

```json
{
  "success": true,
  "payment": {
    "id": "payment_id",
    "amount": 30,
    "currency": "USD",
    "paymentType": "ONLINE",
    "method": "WAAFI_PAY",
    "provider": "EVC_PLUS",
    "status": "PENDING",
    "paymentDate": "2026-06-14T00:00:00.000Z",
    "paidAt": null,
    "reference": null,
    "referenceId": "SUB-subscription_id",
    "invoiceId": "INV-request_id",
    "requestId": "request_id",
    "transactionId": null,
    "phoneNumber": "252612345678",
    "failedReason": null,
    "responseMessage": null,
    "orderId": null,
    "plan": {},
    "subscriptionId": "subscription_id",
    "rawResponse": null
  }
}
```

Waafi responses are saved end to end in the payment record.

## Check Waafi Payment Status

`GET /api/mobile/member/payments/waafi/status/:paymentId`

Response:

```json
{
  "success": true,
  "payment": {}
}
```

The member can only check their own payment.

## Payment History

`GET /api/mobile/member/payments/history`

Response:

```json
{
  "success": true,
  "payments": []
}
```

## Notifications

`GET /api/mobile/member/notifications`

Response:

```json
{
  "success": true,
  "notifications": [
    {
      "id": "notification_id",
      "title": "Payment confirmed",
      "message": "Your payment has been confirmed.",
      "type": "UPGRADE_CONFIRMATION",
      "readStatus": "UNREAD",
      "createdAt": "2026-06-14T00:00:00.000Z"
    }
  ]
}
```

## Register FCM Device Token

`POST /api/mobile/device-tokens`

Request:

```json
{
  "token": "fcm_registration_token_from_mobile_app",
  "platform": "ANDROID",
  "deviceName": "Najib Android"
}
```

Allowed platforms: `ANDROID`, `IOS`, `WEB`, `UNKNOWN`.

Response:

```json
{
  "success": true,
  "message": "Device token registered",
  "deviceToken": {
    "id": "device_token_id",
    "platform": "ANDROID",
    "deviceName": "Najib Android",
    "role": "MEMBER",
    "topic": "members",
    "accountTopic": "mobile-account-account_id",
    "lastSeenAt": "2026-06-14T00:00:00.000Z"
  }
}
```

The same endpoint works for trainer tokens after trainer mobile login. Member tokens subscribe to the `members` topic; trainer tokens subscribe to the `trainers` topic.

## Remove FCM Device Token

`DELETE /api/mobile/device-tokens`

Request:

```json
{
  "token": "fcm_registration_token_from_mobile_app"
}
```

Response:

```json
{
  "success": true,
  "message": "Device token removed"
}
```

## Mark Notification As Read

`PATCH /api/mobile/member/notifications/:notificationId/read`

Response:

```json
{
  "success": true,
  "notification": {
    "id": "notification_id",
    "title": "Payment confirmed",
    "message": "Your payment has been confirmed.",
    "type": "UPGRADE_CONFIRMATION",
    "readStatus": "READ",
    "createdAt": "2026-06-14T00:00:00.000Z"
  }
}
```

The member can only mark their own notification as read.

## Mark All Notifications As Read

`PATCH /api/mobile/member/notifications/mark-all-read`

Response:

```json
{
  "success": true,
  "message": "All notifications marked as read",
  "updatedCount": 1
}
```

## Delete Notification

`DELETE /api/mobile/member/notifications/:notificationId`

Response:

```json
{
  "success": true,
  "message": "Notification deleted"
}
```

The member can only delete their own notification.
