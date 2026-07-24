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
    "profileImage": "/uploads/access-control/member.webp",
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

## Member Profile

### Get Profile

`GET /api/mobile/member/profile`

Response:

```json
{
  "success": true,
  "member": {
    "id": "member_id",
    "fullName": "Member Name",
    "phoneNumber": "0612345678",
    "email": "member@example.com",
    "gender": "MALE",
    "address": "Mogadishu",
    "dateOfBirth": "2000-01-01T00:00:00.000Z",
    "emergencyContact": "0610000000",
    "profileImage": "/uploads/access-control/member.webp",
    "status": "ACTIVE",
    "account": {
      "email": "member@example.com",
      "phone": "0612345678",
      "mustChangePassword": false,
      "lastLoginAt": "2026-07-24T10:00:00.000Z"
    }
  }
}
```

### Update Profile

`PUT /api/mobile/member/profile`

Request can include any editable profile fields:

```json
{
  "fullName": "Member Name",
  "phoneNumber": "0612345678",
  "email": "member@example.com",
  "gender": "MALE",
  "address": "Mogadishu",
  "dateOfBirth": "2000-01-01",
  "emergencyContact": "0610000000",
  "profileImage": "/uploads/access-control/member.webp"
}
```

Use the existing image upload flow first, then send the returned image URL as `profileImage`.

## Attendance

`GET /api/mobile/member/attendance`

Returns attendance records for the authenticated member only. This is read-only for the member app; attendance creation/edit/update remains controlled by the admin attendance module.

Optional query parameters:

- `period`: `today`, `weekly`, `monthly`, or `all`
- `dateFrom`: ISO date/date-time, for example `2026-07-01`
- `dateTo`: ISO date/date-time, for example `2026-07-07`
- `limit`: number of records to return, minimum `1`, maximum `100`, default `50`

Examples:

```http
GET /api/mobile/member/attendance?period=monthly
GET /api/mobile/member/attendance?dateFrom=2026-07-01&dateTo=2026-07-07
```

Response:

```json
{
  "success": true,
  "summary": {
    "total": 8,
    "present": 8,
    "cancelled": 0,
    "lastCheckIn": "2026-07-07T06:30:00.000Z"
  },
  "attendance": [
    {
      "id": "attendance_id",
      "memberId": "member_id",
      "checkInDate": "2026-07-07T06:30:00.000Z",
      "method": "MANUAL",
      "status": "PRESENT",
      "createdAt": "2026-07-07T06:30:00.000Z"
    }
  ]
}
```

Allowed attendance values:

- `method`: `MANUAL`
- `status`: `PRESENT`, `CANCELLED`

## Progress

`GET /api/mobile/member/progress`

Returns a member progress summary built from existing subscription, attendance, workout, and trainer schedule data. There is no separate progress table; this endpoint calculates progress from current gym records.

Optional query parameters:

- `days`: progress attendance range, minimum `7`, maximum `365`, default `30`

Example:

```http
GET /api/mobile/member/progress?days=30
```

Response:

```json
{
  "success": true,
  "progress": {
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
      "startDate": "2026-07-01T00:00:00.000Z",
      "expiryDate": "2026-07-31T00:00:00.000Z",
      "status": "ACTIVE",
      "paymentStatus": "PAID",
      "createdAt": "2026-07-01T00:00:00.000Z"
    },
    "attendance": {
      "totalPresent": 30,
      "presentInRange": 8,
      "presentThisMonth": 8,
      "lastCheckIn": {
        "id": "attendance_id",
        "memberId": "member_id",
        "checkInDate": "2026-07-07T06:30:00.000Z",
        "method": "MANUAL",
        "status": "PRESENT",
        "createdAt": "2026-07-07T06:30:00.000Z"
      },
      "rangeDays": 30
    },
    "training": {
      "activeWorkouts": 4,
      "totalSchedules": 10,
      "completedSchedules": 6,
      "upcomingSchedules": 3,
      "missedSchedules": 1,
      "cancelledSchedules": 0,
      "completionRate": 60,
      "recentCompletedSchedules": []
    }
  }
}
```

Progress rules:

- `activeWorkouts` includes workouts assigned directly to the member and workouts assigned to trainer groups that include the member.
- Schedule counts include direct member schedules and group schedules for groups that include the member.
- `completionRate` is `completedSchedules / totalSchedules * 100`, rounded to the nearest whole number.
- If the member has no active subscription, `subscription` is `null`.

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

Optional filters:

- `status`: `ACTIVE`, `EXPIRED`, `PENDING`, `SUSPENDED`
- `paymentStatus` or `payment_status`: `PAID`, `PENDING`, `FAILED`, `CANCELLED`, `EXPIRED`
- `planId` or `plan_id`: membership plan ID
- `period`: `today`, `week`, `month`, `year`
- `dateFrom` or `date_from`: filter by subscription `createdAt`
- `dateTo` or `date_to`: filter by subscription `createdAt`

Examples:

```http
GET /api/mobile/member/subscription/history?status=ACTIVE
GET /api/mobile/member/subscription/history?paymentStatus=PAID&period=month
GET /api/mobile/member/subscription/history?planId=plan_id&dateFrom=2026-07-01&dateTo=2026-07-31
```

Response:

```json
{
  "success": true,
  "filters": {
    "status": "ACTIVE",
    "paymentStatus": "PAID",
    "planId": "plan_id",
    "period": "month",
    "dateFrom": null,
    "dateTo": null
  },
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

## Store

The member Store uses the existing authenticated member token and the existing Waafi/EVC payment integration.

Important Store rules:

- Only published products are returned to the mobile app.
- Product prices are returned as numbers.
- Products include `availableQuantity` and `isOutOfStock`.
- The member cannot purchase more than the available quantity.
- An order is created only after Waafi/EVC payment is confirmed as `PAID`.
- Product stock is reduced only after a successful paid order is created.
- Failed or cancelled payment attempts are stored as Store transactions, but no paid order is created.

### Flutter Store API Quick Reference

Production API base URL:

```text
https://gym.mrk.so
```

Flutter should send the member mobile token on every Store request:

```dart
final headers = {
  'Authorization': 'Bearer $mobileToken',
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
```

Endpoint summary:

| Screen / Action | Method | Path | Body |
|---|---|---|---|
| Store product list | GET | `/api/mobile/member/store/products` | none |
| Product detail | GET | `/api/mobile/member/store/products/{productId}` | none |
| Purchase product | POST | `/api/mobile/member/store/products/{productId}/purchase` | `quantity`, `phoneNumber`, `provider`, `currency` |
| My orders | GET | `/api/mobile/member/store/orders` | none |
| Order detail | GET | `/api/mobile/member/store/orders/{orderId}` | none |

Flutter payload for purchase:

```dart
final body = {
  'quantity': selectedQuantity,
  'phoneNumber': paymentPhoneNumber,
  'provider': 'EVC_PLUS',
  'currency': 'USD',
};
```

Equivalent JSON:

```json
{
  "quantity": 2,
  "phoneNumber": "252612345678",
  "provider": "EVC_PLUS",
  "currency": "USD"
}
```

Flutter should calculate the preview total before submitting:

```dart
final totalAmount = product.price * selectedQuantity;
```

The backend recalculates the total from the database price, so Flutter does not need to send `price`, `unitPrice`, or `totalAmount`.

Flutter response keys to read:

| Endpoint | Main response key | Notes |
|---|---|---|
| Product list | `products` | Array of published products only |
| Product detail | `product` | Single product object |
| Purchase | `paymentStatus`, `order`, `transaction`, `product`, `message` | `order` is `null` if payment did not complete |
| My orders | `orders` | Array of current member orders |
| Order detail | `order` | Includes `transaction` when available |

Product object fields for Flutter model:

```dart
class StoreProduct {
  final String id;
  final String name;
  final String? category;
  final String? image;
  final String? description;
  final double price;
  final String currency;
  final int availableQuantity;
  final bool isOutOfStock;
  final String status;
}
```

Order object fields for Flutter model:

```dart
class StoreOrder {
  final String id;
  final String orderNumber;
  final String buyerName;
  final String buyerType;
  final String buyerPhoneNumber;
  final StoreProduct? product;
  final int quantity;
  final double unitPrice;
  final double totalAmount;
  final String currency;
  final String paymentMethod;
  final String? provider;
  final String? evcTransactionReference;
  final String paymentStatus;
  final String orderStatus;
  final DateTime orderDate;
  final DateTime? paidAt;
}
```

Recommended Flutter purchase handling:

1. Disable the buy button when `product.isOutOfStock == true`.
2. Do not allow `selectedQuantity > product.availableQuantity`.
3. Show preview total from `product.price * selectedQuantity`.
4. Submit purchase payload.
5. If `paymentStatus == 'PAID' && order != null`, show success and refresh product/order lists.
6. If `order == null`, show `message` or `transaction.failedReason`.

### List Published Store Products

`GET /api/mobile/member/store/products`

Response:

```json
{
  "success": true,
  "products": [
    {
      "id": "product_id",
      "name": "Protein Powder",
      "category": "Supplements",
      "image": "/uploads/store/protein.webp",
      "description": "Whey protein for recovery",
      "price": 25,
      "currency": "USD",
      "availableQuantity": 10,
      "isOutOfStock": false,
      "status": "PUBLISHED",
      "createdAt": "2026-07-24T10:00:00.000Z",
      "updatedAt": "2026-07-24T10:00:00.000Z"
    }
  ]
}
```

### Store Product Detail

`GET /api/mobile/member/store/products/:productId`

Response:

```json
{
  "success": true,
  "product": {
    "id": "product_id",
    "name": "Protein Powder",
    "category": "Supplements",
    "image": "/uploads/store/protein.webp",
    "description": "Whey protein for recovery",
    "price": 25,
    "currency": "USD",
    "availableQuantity": 10,
    "isOutOfStock": false,
    "status": "PUBLISHED",
    "createdAt": "2026-07-24T10:00:00.000Z",
    "updatedAt": "2026-07-24T10:00:00.000Z"
  }
}
```

If the product is unpublished or does not exist, the API returns `404`.

### Purchase Store Product With EVC/Waafi

`POST /api/mobile/member/store/products/:productId/purchase`

Request:

```json
{
  "quantity": 2,
  "phoneNumber": "252612345678",
  "provider": "EVC_PLUS",
  "currency": "USD"
}
```

Allowed providers: `EVC_PLUS`, `JEEB`, `ZAAD`, `SAHAL`.

Response when payment is confirmed and the order is created:

```json
{
  "success": true,
  "paymentStatus": "PAID",
  "message": "Payment confirmed and order created successfully",
  "product": {
    "id": "product_id",
    "name": "Protein Powder",
    "category": "Supplements",
    "image": "/uploads/store/protein.webp",
    "description": "Whey protein for recovery",
    "price": 25,
    "currency": "USD",
    "availableQuantity": 8,
    "isOutOfStock": false,
    "status": "PUBLISHED"
  },
  "order": {
    "id": "order_id",
    "orderNumber": "ORD-20260724102530-ABCDE",
    "buyerName": "Member Name",
    "buyerType": "MEMBER",
    "buyerPhoneNumber": "252612345678",
    "product": {
      "id": "product_id",
      "name": "Protein Powder",
      "category": "Supplements",
      "image": "/uploads/store/protein.webp",
      "price": 25,
      "currency": "USD",
      "availableQuantity": 8,
      "isOutOfStock": false,
      "status": "PUBLISHED"
    },
    "quantity": 2,
    "unitPrice": 25,
    "totalAmount": 50,
    "currency": "USD",
    "paymentMethod": "WAAFI_PAY",
    "provider": "EVC_PLUS",
    "evcTransactionReference": "waafi_response_or_request_reference",
    "paymentStatus": "PAID",
    "orderStatus": "PROCESSING",
    "orderDate": "2026-07-24T10:25:30.000Z",
    "paidAt": "2026-07-24T10:25:30.000Z"
  },
  "transaction": {
    "id": "transaction_id",
    "transactionReference": "waafi_response_or_request_reference",
    "orderNumber": "ORD-20260724102530-ABCDE",
    "buyerName": "Member Name",
    "buyerType": "MEMBER",
    "phoneNumber": "252612345678",
    "product": {
      "id": "product_id",
      "name": "Protein Powder",
      "category": "Supplements"
    },
    "quantity": 2,
    "amount": 50,
    "currency": "USD",
    "paymentMethod": "WAAFI_PAY",
    "provider": "EVC_PLUS",
    "paymentStatus": "PAID",
    "requestId": "waafi_request_id",
    "referenceId": "STORE-product_id",
    "invoiceId": "STORE-INV-waafi_request_id",
    "failedReason": null,
    "transactionDate": "2026-07-24T10:25:30.000Z"
  }
}
```

Response when payment is not completed:

```json
{
  "success": true,
  "paymentStatus": "FAILED",
  "message": "Payment was not completed. Order was not created.",
  "product": {},
  "order": null,
  "transaction": {
    "id": "transaction_id",
    "paymentStatus": "FAILED",
    "failedReason": "WaafiPay request failed"
  }
}
```

Common Store purchase errors:

- Product is out of stock.
- Requested quantity is more than available stock.
- Enter a valid Somalia mobile number.
- WaafiPay is disabled or not configured.

### My Store Orders

`GET /api/mobile/member/store/orders`

Returns only orders created by the authenticated member.

Response:

```json
{
  "success": true,
  "orders": [
    {
      "id": "order_id",
      "orderNumber": "ORD-20260724102530-ABCDE",
      "buyerName": "Member Name",
      "buyerType": "MEMBER",
      "buyerPhoneNumber": "252612345678",
      "product": {
        "id": "product_id",
        "name": "Protein Powder",
        "category": "Supplements",
        "image": "/uploads/store/protein.webp",
        "price": 25,
        "currency": "USD"
      },
      "quantity": 2,
      "unitPrice": 25,
      "totalAmount": 50,
      "currency": "USD",
      "paymentMethod": "WAAFI_PAY",
      "provider": "EVC_PLUS",
      "evcTransactionReference": "waafi_response_or_request_reference",
      "paymentStatus": "PAID",
      "orderStatus": "PROCESSING",
      "orderDate": "2026-07-24T10:25:30.000Z",
      "paidAt": "2026-07-24T10:25:30.000Z"
    }
  ]
}
```

### Store Order Detail

`GET /api/mobile/member/store/orders/:orderId`

The member can only view their own order.

Response:

```json
{
  "success": true,
  "order": {
    "id": "order_id",
    "orderNumber": "ORD-20260724102530-ABCDE",
    "buyerName": "Member Name",
    "buyerType": "MEMBER",
    "buyerPhoneNumber": "252612345678",
    "product": {
      "id": "product_id",
      "name": "Protein Powder",
      "category": "Supplements",
      "image": "/uploads/store/protein.webp",
      "price": 25,
      "currency": "USD"
    },
    "quantity": 2,
    "unitPrice": 25,
    "totalAmount": 50,
    "currency": "USD",
    "paymentMethod": "WAAFI_PAY",
    "provider": "EVC_PLUS",
    "evcTransactionReference": "waafi_response_or_request_reference",
    "paymentStatus": "PAID",
    "orderStatus": "PROCESSING",
    "orderDate": "2026-07-24T10:25:30.000Z",
    "paidAt": "2026-07-24T10:25:30.000Z",
    "transaction": {
      "id": "transaction_id",
      "transactionReference": "waafi_response_or_request_reference",
      "paymentStatus": "PAID",
      "requestId": "waafi_request_id"
    }
  }
}
```

Allowed Store values:

- `product.status`: `PUBLISHED`, `UNPUBLISHED`
- `buyerType`: `MEMBER`
- `paymentMethod`: `WAAFI_PAY`
- `paymentStatus`: `PAID`, `PENDING`, `FAILED`, `CANCELLED`, `EXPIRED`
- `orderStatus`: `PROCESSING`, `COMPLETED`, `CANCELLED`, `FAILED`

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
