# Mobile Member API Smoke Responses

Run date: 2026-06-14

Smoke data used:

- Member: `Mobile Smoke Member 95701788`
- Phone login tested as: `252619570178`
- Plan: `Mobile Smoke Plan 95701788`
- Token value is intentionally redacted in this file.

## `POST /api/mobile/auth/login`

Status: `200`

```json
{
  "success": true,
  "token": "[redacted]",
  "role": "MEMBER",
  "user": {
    "id": "2c1b6080-d644-4756-8910-70bb7ee8be7b",
    "accountId": "522d521f-08b3-43f4-aeef-ee85539ed788",
    "role": "MEMBER",
    "name": "Mobile Smoke Member 95701788",
    "email": null,
    "phone": "0619570178",
    "accountStatus": "ACTIVE",
    "mustChangePassword": true
  }
}
```

## `GET /api/mobile/member/dashboard`

Status: `200`

```json
{
  "success": true,
  "member": {
    "id": "2c1b6080-d644-4756-8910-70bb7ee8be7b",
    "fullName": "Mobile Smoke Member 95701788",
    "phoneNumber": "0619570178",
    "email": null,
    "status": "ACTIVE"
  },
  "account": {
    "accountId": "522d521f-08b3-43f4-aeef-ee85539ed788",
    "mustChangePassword": true
  },
  "summary": {
    "hasActiveSubscription": true,
    "paymentCount": 2,
    "unreadNotifications": 1
  },
  "currentSubscription": {
    "id": "73d989ac-2b1e-4e6b-b880-2592c351634c",
    "status": "ACTIVE",
    "paymentStatus": "PAID"
  },
  "recentPayments": [
    {
      "id": "ca390ee2-8a80-4c8b-a3f7-1a20afcc9229",
      "amount": 25,
      "method": "WAAFI_PAY",
      "status": "PENDING",
      "requestId": "REQ-95701788",
      "invoiceId": "INV-95701788"
    },
    {
      "id": "a096612e-705e-429e-bb86-95755aa9e921",
      "amount": 25,
      "method": "CASH",
      "status": "PAID",
      "reference": "SMOKE-95701788"
    }
  ],
  "latestNotifications": [
    {
      "id": "49832a9b-c2df-4176-82c2-a2acfe190ec8",
      "title": "Smoke notification",
      "readStatus": "UNREAD"
    }
  ]
}
```

## `GET /api/mobile/member/subscription/current`

Status: `200`

```json
{
  "success": true,
  "subscription": {
    "id": "73d989ac-2b1e-4e6b-b880-2592c351634c",
    "plan": {
      "id": "dd104530-85f9-4182-91bf-f1b04f0e21f7",
      "name": "Mobile Smoke Plan 95701788",
      "type": "MONTHLY",
      "durationDays": 30,
      "price": 25,
      "currency": "USD",
      "description": "Smoke test plan",
      "status": "ACTIVE"
    },
    "startDate": "2026-06-14T00:08:26.378Z",
    "expiryDate": "2026-07-14T00:08:26.378Z",
    "status": "ACTIVE",
    "paymentStatus": "PAID",
    "createdAt": "2026-06-14T00:08:26.383Z"
  }
}
```

## `GET /api/mobile/member/subscription/history`

Status: `200`

```json
{
  "success": true,
  "subscriptions": [
    {
      "id": "73d989ac-2b1e-4e6b-b880-2592c351634c",
      "status": "ACTIVE",
      "paymentStatus": "PAID"
    }
  ]
}
```

## `GET /api/mobile/member/plans`

Status: `200`

```json
{
  "success": true,
  "plans": [
    {
      "id": "93886172-930d-4b1a-8373-0955b2ec901d",
      "name": "Bille",
      "type": "MONTHLY",
      "durationDays": 30,
      "price": 0.01,
      "currency": "USD",
      "description": "Xirmada Bille ah",
      "status": "ACTIVE"
    },
    {
      "id": "6289a910-a1e9-4180-9dd7-7b46bf9faccd",
      "name": "Smoke Waafi Plan 1781201911840",
      "type": "MONTHLY",
      "durationDays": 30,
      "price": 15,
      "currency": "USD",
      "description": "API smoke test plan",
      "status": "ACTIVE"
    },
    {
      "id": "dd104530-85f9-4182-91bf-f1b04f0e21f7",
      "name": "Mobile Smoke Plan 95701788",
      "type": "MONTHLY",
      "durationDays": 30,
      "price": 25,
      "currency": "USD",
      "description": "Smoke test plan",
      "status": "ACTIVE"
    },
    {
      "id": "3fd87d4f-3c0b-49f4-9154-c3d002eecdb5",
      "name": "E2E Onboarding Plan 403730453",
      "type": "MONTHLY",
      "durationDays": 30,
      "price": 49,
      "currency": "USD",
      "description": "Created by onboarding E2E check",
      "status": "ACTIVE"
    }
  ]
}
```

## `POST /api/mobile/member/subscription/upgrade`

Status: `200`

```json
{
  "success": true,
  "message": "Upgrade request created. Complete payment to activate the subscription.",
  "subscription": {
    "id": "663f8e01-1ee8-44c1-80e2-d9d789ae0b35",
    "status": "PENDING",
    "paymentStatus": "PENDING"
  },
  "paymentRequired": true
}
```

## `POST /api/mobile/member/subscription/renew`

Status: `200`

```json
{
  "success": true,
  "message": "Renewal request created. Complete payment to activate the subscription.",
  "subscription": {
    "id": "c2843f17-1246-47b7-84f6-223fe7845617",
    "status": "PENDING",
    "paymentStatus": "PENDING"
  },
  "paymentRequired": true
}
```

## `GET /api/mobile/member/payments/history`

Status: `200`

```json
{
  "success": true,
  "payments": [
    {
      "id": "ca390ee2-8a80-4c8b-a3f7-1a20afcc9229",
      "amount": 25,
      "paymentType": "ONLINE",
      "method": "WAAFI_PAY",
      "provider": "EVC_PLUS",
      "status": "PENDING",
      "requestId": "REQ-95701788",
      "invoiceId": "INV-95701788"
    },
    {
      "id": "a096612e-705e-429e-bb86-95755aa9e921",
      "amount": 25,
      "paymentType": "MANUAL",
      "method": "CASH",
      "status": "PAID",
      "reference": "SMOKE-95701788"
    }
  ]
}
```

## `GET /api/mobile/member/payments/waafi/status/:paymentId`

Status: `200`

```json
{
  "success": true,
  "payment": {
    "id": "ca390ee2-8a80-4c8b-a3f7-1a20afcc9229",
    "amount": 25,
    "paymentType": "ONLINE",
    "method": "WAAFI_PAY",
    "provider": "EVC_PLUS",
    "status": "PENDING",
    "requestId": "REQ-95701788",
    "invoiceId": "INV-95701788"
  }
}
```

## `POST /api/mobile/member/payments/waafi/initiate`

Validation smoke used an intentionally invalid phone number to avoid triggering a real Waafi customer prompt.

Status: `400`

```json
{
  "error": "Enter a valid Somalia mobile number"
}
```

## `GET /api/mobile/member/notifications`

Status: `200`

```json
{
  "success": true,
  "notifications": [
    {
      "id": "49832a9b-c2df-4176-82c2-a2acfe190ec8",
      "title": "Smoke notification",
      "message": "Member mobile API smoke notification.",
      "type": "GENERAL_MESSAGE",
      "readStatus": "UNREAD",
      "createdAt": "2026-06-14T00:08:27.835Z"
    }
  ]
}
```

## `PATCH /api/mobile/member/notifications/:notificationId/read`

Status: `200`

```json
{
  "success": true,
  "notification": {
    "id": "49832a9b-c2df-4176-82c2-a2acfe190ec8",
    "title": "Smoke notification",
    "message": "Member mobile API smoke notification.",
    "type": "GENERAL_MESSAGE",
    "readStatus": "READ",
    "createdAt": "2026-06-14T00:08:27.835Z"
  }
}
```
