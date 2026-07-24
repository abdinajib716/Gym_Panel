"use client"

import { CrudPage, StatusPill, currency, shortDate } from "@/components/gym/crud-page"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type RecordValue = Record<string, unknown>

const genderOptions = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
]

const memberStatusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Pending", value: "PENDING" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Expired", value: "EXPIRED" },
]

const activeOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
]

const planTypeOptions = [
  { label: "Monthly", value: "MONTHLY" },
  { label: "Quarterly", value: "QUARTERLY" },
  { label: "Annual", value: "ANNUAL" },
  { label: "Group Training", value: "GROUP_TRAINING" },
  { label: "Personal Training", value: "PERSONAL_TRAINING" },
]

const subscriptionStatusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Pending", value: "PENDING" },
  { label: "Suspended", value: "SUSPENDED" },
]

const paymentStatusOptions = [
  { label: "Paid", value: "PAID" },
  { label: "Pending", value: "PENDING" },
  { label: "Failed", value: "FAILED" },
  { label: "Cancelled", value: "CANCELLED" },
]

const paymentMethodOptions = [
  { label: "Cash", value: "CASH" },
  { label: "Manual EVC", value: "MANUAL_EVC" },
  { label: "EVC manual confirmation", value: "EVC_MANUAL" },
  { label: "Bank transfer", value: "BANK_TRANSFER" },
  { label: "Other manual mobile money", value: "OTHER_MANUAL_MOBILE_MONEY" },
  { label: "WaafiPay", value: "WAAFI_PAY" },
  { label: "Waafi", value: "WAAFI" },
  { label: "EVC online", value: "EVC_ONLINE" },
]

const manualPaymentMethodOptions = paymentMethodOptions.filter((option) => !["WAAFI", "WAAFI_PAY", "EVC_ONLINE"].includes(option.value))

const attendanceStatusOptions = [
  { label: "Present", value: "PRESENT" },
  { label: "Cancelled", value: "CANCELLED" },
]

const notificationTypeOptions = [
  { label: "Payment Reminder", value: "PAYMENT_REMINDER" },
  { label: "Subscription Expiry", value: "SUBSCRIPTION_EXPIRY" },
  { label: "Gym Announcement", value: "GYM_ANNOUNCEMENT" },
  { label: "Upgrade Confirmation", value: "UPGRADE_CONFIRMATION" },
  { label: "General Message", value: "GENERAL_MESSAGE" },
]

const notificationTargetOptions = [
  { label: "All members", value: "ALL_MEMBERS" },
  { label: "All trainers", value: "ALL_TRAINERS" },
  { label: "Single member", value: "SINGLE_MEMBER" },
]

const readStatusOptions = [
  { label: "Unread", value: "UNREAD" },
  { label: "Read", value: "READ" },
]

const storeProductStatusOptions = [
  { label: "Published", value: "PUBLISHED" },
  { label: "Unpublished", value: "UNPUBLISHED" },
]

const storeOrderStatusOptions = [
  { label: "Processing", value: "PROCESSING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Failed", value: "FAILED" },
]

function nested(record: RecordValue, key: string) {
  return key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined
    return (current as RecordValue)[part]
  }, record)
}

function compactText(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback
  return String(value)
}

function jsonBlock(value: unknown) {
  return (
    <pre className="max-h-72 overflow-auto rounded-md bg-muted/35 p-3 text-xs font-normal text-muted-foreground">
      {JSON.stringify(value ?? {}, null, 2)}
    </pre>
  )
}

function initials(value: unknown) {
  return String(value || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function PersonCell({ record, imageKey = "profileImage" }: { record: RecordValue; imageKey?: string }) {
  const name = String(record.fullName ?? record.name ?? "Unknown")
  const image = nested(record, imageKey) as string | null | undefined

  return (
    <div className="flex min-w-44 items-center gap-3">
      <Avatar className="h-10 w-10 ring-1 ring-border/80">
        <AvatarImage src={image || undefined} alt={name} />
        <AvatarFallback className="bg-primary/10 text-primary">{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{String(record.phoneNumber ?? record.email ?? "")}</p>
      </div>
    </div>
  )
}

function ProductImageCell({ record }: { record: RecordValue }) {
  const name = String(record.name ?? "Product")
  const image = record.image as string | null | undefined

  return (
    <Avatar className="h-11 w-11 rounded-xl ring-1 ring-border/80">
      <AvatarImage src={image || undefined} alt={name} className="object-cover" />
      <AvatarFallback className="rounded-xl bg-primary/10 text-primary">{initials(name)}</AvatarFallback>
    </Avatar>
  )
}

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function nowDateTime() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export function MembersPage() {
  return (
    <CrudPage
      title="Members"
      description="Create and manage gym member accounts from the admin panel."
      breadcrumb={["Dashboard", "Members"]}
      endpoint="/api/v1/members"
      dataKey="members"
      recordName="member"
      searchPlaceholder="Search members by name, phone, or email"
      statusOptions={memberStatusOptions}
      defaultValues={{
        fullName: "",
        phoneNumber: "",
        email: "",
        gender: "MALE",
        address: "",
        dateOfBirth: "",
        emergencyContact: "",
        profileImage: "",
        status: "PENDING",
        trainerId: "",
        initialPlanId: "",
        subscriptionStartDate: todayDate(),
        paymentAmount: "",
        paymentMethod: "CASH",
        paymentStatus: "PENDING",
        paymentDate: nowDateTime(),
        paymentReference: "",
        paymentNotes: "",
      }}
      fields={[
        { name: "fullName", label: "Full name", placeholder: "Member full name", section: "Member details" },
        { name: "phoneNumber", label: "Phone number", placeholder: "+252...", section: "Member details" },
        { name: "email", label: "Email", type: "email", placeholder: "member@example.com", section: "Member details" },
        { name: "gender", label: "Gender", type: "select", options: genderOptions, section: "Member details" },
        { name: "address", label: "Address", section: "Member details" },
        { name: "dateOfBirth", label: "Date of birth", type: "date", section: "Member details" },
        { name: "emergencyContact", label: "Emergency contact", section: "Member details" },
        { name: "profileImage", label: "Profile image", type: "image", section: "Member details", className: "md:col-span-2" },
        { name: "status", label: "Account status", type: "select", options: memberStatusOptions, section: "Member details" },
        { name: "trainerId", label: "Trainer", type: "select", optionsSource: "trainers", optionLabel: "fullName", section: "Member details" },
        { name: "initialPlanId", label: "Membership plan", type: "select", optionsSource: "plans", optionLabel: "name", section: "Membership plan", hideOnEdit: true },
        { name: "subscriptionStartDate", label: "Subscription start date", type: "date", section: "Membership plan", hideOnEdit: true },
        { name: "paymentAmount", label: "Payment amount", type: "number", placeholder: "Defaults to selected plan price", section: "Manual payment", hideOnEdit: true },
        { name: "paymentMethod", label: "Payment method", type: "select", options: paymentMethodOptions.filter((option) => !["WAAFI", "EVC_ONLINE"].includes(option.value)), section: "Manual payment", hideOnEdit: true },
        { name: "paymentStatus", label: "Payment status", type: "select", options: paymentStatusOptions, section: "Manual payment", hideOnEdit: true },
        { name: "paymentDate", label: "Payment date", type: "datetime-local", section: "Manual payment", hideOnEdit: true },
        { name: "paymentReference", label: "Reference number", section: "Manual payment", hideOnEdit: true },
        { name: "paymentNotes", label: "Notes", type: "textarea", section: "Manual payment", className: "md:col-span-2", hideOnEdit: true },
      ]}
      columns={[
        { key: "fullName", label: "Member", render: (record) => <PersonCell record={record} /> },
        { key: "phoneNumber", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "status", label: "Status", render: (record) => <StatusPill value={String(record.status)} /> },
        { key: "subscriptions.0.status", label: "Subscription", render: (record) => <StatusPill value={String(nested(record, "subscriptions.0.status") ?? "PENDING")} /> },
        { key: "trainer.fullName", label: "Trainer" },
      ]}
    />
  )
}

export function MembershipPlansPage() {
  return (
    <CrudPage
      title="Membership Plans"
      description="Create, price, activate, and deactivate gym plans."
      breadcrumb={["Dashboard", "Membership Plans"]}
      endpoint="/api/v1/membership-plans"
      dataKey="plans"
      recordName="plan"
      searchPlaceholder="Search plans by name"
      statusOptions={activeOptions}
      typeOptions={planTypeOptions}
      defaultValues={{ name: "", type: "MONTHLY", durationDays: 30, price: 0, description: "", status: "ACTIVE" }}
      fields={[
        { name: "name", label: "Plan name" },
        { name: "type", label: "Plan type", type: "select", options: planTypeOptions },
        { name: "durationDays", label: "Duration days", type: "number" },
        { name: "price", label: "Price", type: "number" },
        { name: "description", label: "Description", type: "textarea", className: "md:col-span-2" },
        { name: "status", label: "Status", type: "select", options: activeOptions },
      ]}
      columns={[
        { key: "name", label: "Plan" },
        { key: "type", label: "Type", render: (record) => <StatusPill value={String(record.type)} /> },
        { key: "durationDays", label: "Duration" },
        { key: "price", label: "Price", render: (record) => currency(record.price) },
        { key: "status", label: "Status", render: (record) => <StatusPill value={String(record.status)} /> },
      ]}
    />
  )
}

export function SubscriptionsPage() {
  return (
    <CrudPage
      title="Subscriptions"
      description="Assign, renew, upgrade, and suspend member subscriptions."
      breadcrumb={["Dashboard", "Subscriptions"]}
      endpoint="/api/v1/subscriptions"
      dataKey="subscriptions"
      recordName="subscription"
      searchPlaceholder="Search by member or plan"
      statusOptions={subscriptionStatusOptions}
      defaultValues={{
        memberId: "",
        planId: "",
        startDate: todayDate(),
        expiryDate: todayDate(),
        status: "PENDING",
        paymentStatus: "PENDING",
      }}
      fields={[
        { name: "memberId", label: "Member", type: "select", optionsSource: "members", optionLabel: "fullName" },
        { name: "planId", label: "Plan", type: "select", optionsSource: "plans", optionLabel: "name" },
        { name: "startDate", label: "Start date", type: "date" },
        { name: "expiryDate", label: "Expiry date", type: "date" },
        { name: "status", label: "Status", type: "select", options: subscriptionStatusOptions },
        { name: "paymentStatus", label: "Payment status", type: "select", options: paymentStatusOptions },
      ]}
      columns={[
        { key: "member.fullName", label: "Member" },
        { key: "plan.name", label: "Plan" },
        { key: "startDate", label: "Start", render: (record) => shortDate(record.startDate) },
        { key: "expiryDate", label: "Expiry", render: (record) => shortDate(record.expiryDate) },
        { key: "status", label: "Status", render: (record) => <StatusPill value={String(record.status)} /> },
        { key: "paymentStatus", label: "Payment", render: (record) => <StatusPill value={String(record.paymentStatus)} /> },
      ]}
    />
  )
}

export function PaymentsPage() {
  return (
    <CrudPage
      title="Payments"
      description="Record manual payments and review WaafiPay transaction responses."
      breadcrumb={["Dashboard", "Payments"]}
      endpoint="/api/v1/payments"
      dataKey="payments"
      recordName="payment"
      searchPlaceholder="Search by member, reference, or transaction"
      statusOptions={paymentStatusOptions}
      methodOptions={paymentMethodOptions}
      defaultValues={{
        memberId: "",
        subscriptionId: "",
        planId: "",
        amount: 0,
        method: "CASH",
        status: "PENDING",
        paymentDate: nowDateTime(),
        reference: "",
        notes: "",
        transactionId: "",
        provider: "",
      }}
      fields={[
        { name: "memberId", label: "Member", type: "select", optionsSource: "members", optionLabel: "fullName" },
        { name: "subscriptionId", label: "Subscription", type: "select", optionsSource: "subscriptions" },
        { name: "planId", label: "Plan", type: "select", optionsSource: "plans", optionLabel: "name" },
        { name: "amount", label: "Amount", type: "number" },
        { name: "method", label: "Payment method", type: "select", options: manualPaymentMethodOptions },
        { name: "status", label: "Payment status", type: "select", options: paymentStatusOptions },
        { name: "paymentDate", label: "Payment date", type: "datetime-local" },
        { name: "reference", label: "Reference number" },
        { name: "transactionId", label: "Transaction ID" },
        { name: "provider", label: "Provider" },
        { name: "notes", label: "Notes", type: "textarea", className: "md:col-span-2" },
      ]}
      columns={[
        { key: "member.fullName", label: "Member" },
        { key: "plan.name", label: "Plan" },
        { key: "amount", label: "Amount", render: (record) => currency(record.amount) },
        { key: "method", label: "Method", render: (record) => <StatusPill value={String(record.method)} /> },
        { key: "status", label: "Status", render: (record) => <StatusPill value={String(record.status)} /> },
        { key: "transactionId", label: "Transaction", render: (record) => compactText(record.transactionId ?? record.requestId) },
        { key: "failedReason", label: "Waafi Message", render: (record) => compactText(record.failedReason ?? nested(record, "rawResponse.responseMessage")) },
      ]}
      detailFields={[
        { key: "member.fullName", label: "Member" },
        { key: "plan.name", label: "Plan" },
        { key: "amount", label: "Amount", render: (record) => currency(record.amount) },
        { key: "currency", label: "Currency" },
        { key: "paymentType", label: "Payment Type", render: (record) => <StatusPill value={String(record.paymentType ?? "MANUAL")} /> },
        { key: "method", label: "Method", render: (record) => <StatusPill value={String(record.method)} /> },
        { key: "onlineProvider", label: "Waafi Provider", render: (record) => compactText(record.onlineProvider ?? record.provider) },
        { key: "status", label: "Status", render: (record) => <StatusPill value={String(record.status)} /> },
        { key: "phoneNumber", label: "Phone Number" },
        { key: "requestId", label: "Request ID" },
        { key: "invoiceId", label: "Invoice ID" },
        { key: "referenceId", label: "Internal Reference" },
        { key: "reference", label: "Waafi Order ID" },
        { key: "transactionId", label: "Waafi Response ID" },
        { key: "failedReason", label: "Failure Reason" },
        { key: "rawResponse.body.responseCode", label: "Waafi Response Code" },
        { key: "rawResponse.body.errorCode", label: "Waafi Error Code" },
        { key: "rawResponse.body.responseMsg", label: "Waafi Response Message" },
        { key: "rawResponse.body.params.description", label: "Waafi Description" },
        { key: "paymentDate", label: "Payment Date", render: (record) => shortDate(record.paymentDate) },
        { key: "paidAt", label: "Paid At", render: (record) => shortDate(record.paidAt) },
      ]}
    />
  )
}

export function AttendancePage() {
  return (
    <CrudPage
      title="Attendance"
      description="Record manual check-ins and review attendance history."
      breadcrumb={["Dashboard", "Attendance"]}
      endpoint="/api/v1/attendance"
      dataKey="attendance"
      recordName="attendance"
      searchPlaceholder="Search by member"
      statusOptions={attendanceStatusOptions}
      defaultValues={{ memberId: "", checkInDate: nowDateTime(), method: "MANUAL", status: "PRESENT" }}
      fields={[
        { name: "memberId", label: "Member", type: "select", optionsSource: "members", optionLabel: "fullName" },
        { name: "checkInDate", label: "Check-in date", type: "datetime-local" },
        { name: "method", label: "Method", type: "select", options: [{ label: "Manual", value: "MANUAL" }] },
        { name: "status", label: "Status", type: "select", options: attendanceStatusOptions },
      ]}
      columns={[
        { key: "member.fullName", label: "Member" },
        { key: "checkInDate", label: "Check-in", render: (record) => shortDate(record.checkInDate) },
        { key: "method", label: "Method", render: (record) => <StatusPill value={String(record.method)} /> },
        { key: "status", label: "Status", render: (record) => <StatusPill value={String(record.status)} /> },
      ]}
    />
  )
}

export function NotificationsPage() {
  return (
    <CrudPage
      title="Notifications"
      description="Send announcements, payment reminders, and subscription messages."
      breadcrumb={["Dashboard", "Notifications"]}
      endpoint="/api/v1/notifications"
      dataKey="notifications"
      recordName="notification"
      searchPlaceholder="Search title, message, or member"
      typeOptions={notificationTypeOptions}
      defaultValues={{
        title: "",
        message: "",
        type: "GENERAL_MESSAGE",
        target: "ALL_MEMBERS",
        memberId: "",
        readStatus: "UNREAD",
      }}
      fields={[
        { name: "title", label: "Title" },
        { name: "type", label: "Type", type: "select", options: notificationTypeOptions },
        { name: "target", label: "Target", type: "select", options: notificationTargetOptions },
        { name: "memberId", label: "Target member", type: "select", optionsSource: "members", optionLabel: "fullName" },
        { name: "readStatus", label: "Read status", type: "select", options: readStatusOptions },
        { name: "message", label: "Message", type: "textarea", className: "md:col-span-2" },
      ]}
      columns={[
        { key: "title", label: "Title" },
        { key: "type", label: "Type", render: (record) => <StatusPill value={String(record.type)} /> },
        { key: "target", label: "Target", render: (record) => <StatusPill value={String(record.target)} /> },
        { key: "member.fullName", label: "Member" },
        { key: "readStatus", label: "Read", render: (record) => <StatusPill value={String(record.readStatus)} /> },
        { key: "createdAt", label: "Created", render: (record) => shortDate(record.createdAt) },
      ]}
    />
  )
}

export function TrainersPage() {
  return (
    <CrudPage
      title="Trainers"
      description="Manage trainer profiles, specialties, availability, and status."
      breadcrumb={["Dashboard", "Gym Management", "Trainers"]}
      endpoint="/api/v1/trainers"
      dataKey="trainers"
      recordName="trainer"
      searchPlaceholder="Search trainers by name, phone, email, or specialty"
      statusOptions={activeOptions}
      defaultValues={{
        fullName: "",
        phoneNumber: "",
        email: "",
        gender: "MALE",
        specialty: "",
        availability: "",
        profileImage: "",
        status: "ACTIVE",
      }}
      fields={[
        { name: "fullName", label: "Full name" },
        { name: "phoneNumber", label: "Phone number" },
        { name: "email", label: "Email", type: "email" },
        { name: "gender", label: "Gender", type: "select", options: genderOptions },
        { name: "specialty", label: "Specialty" },
        { name: "availability", label: "Availability" },
        { name: "profileImage", label: "Profile image", type: "image", className: "md:col-span-2" },
        { name: "status", label: "Status", type: "select", options: activeOptions },
      ]}
      columns={[
        { key: "fullName", label: "Trainer", render: (record) => <PersonCell record={record} /> },
        { key: "phoneNumber", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "specialty", label: "Specialty" },
        { key: "availability", label: "Availability" },
        { key: "status", label: "Status", render: (record) => <StatusPill value={String(record.status)} /> },
      ]}
      detailFields={[
        { key: "fullName", label: "Full name" },
        { key: "phoneNumber", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "gender", label: "Gender" },
        { key: "specialty", label: "Specialty" },
        { key: "availability", label: "Availability" },
        { key: "profileImage", label: "Profile image" },
        { key: "status", label: "Profile status", render: (record) => <StatusPill value={String(record.status)} /> },
        { key: "mobileAccount.accountStatus", label: "Login status", render: (record) => <StatusPill value={String(nested(record, "mobileAccount.accountStatus") ?? "INACTIVE")} /> },
        { key: "mobileAccount.lastLoginAt", label: "Last login", render: (record) => shortDate(nested(record, "mobileAccount.lastLoginAt")) },
        { key: "createdAt", label: "Created", render: (record) => shortDate(record.createdAt) },
      ]}
    />
  )
}

export function StoreProductsPage() {
  return (
    <CrudPage
      title="Store Products"
      description="Create, publish, unpublish, and track stock for products sold in the mobile app."
      breadcrumb={["Dashboard", "Store", "Products"]}
      endpoint="/api/v1/store/products"
      dataKey="products"
      recordName="product"
      bulkDeleteResource="store-products"
      searchPlaceholder="Search products by name or description"
      statusOptions={storeProductStatusOptions}
      defaultValues={{
        name: "",
        category: "",
        image: "",
        description: "",
        price: 0,
        availableQuantity: 0,
        status: "UNPUBLISHED",
      }}
      fields={[
        { name: "name", label: "Product name" },
        { name: "category", label: "Category", placeholder: "Supplements, apparel, equipment..." },
        { name: "image", label: "Product image", type: "image", className: "md:col-span-2" },
        { name: "description", label: "Description", type: "textarea", className: "md:col-span-2" },
        { name: "price", label: "Price", type: "number" },
        { name: "availableQuantity", label: "Available quantity", type: "number" },
        { name: "status", label: "Publication status", type: "select", options: storeProductStatusOptions },
      ]}
      columns={[
        { key: "image", label: "Image", render: (record) => <ProductImageCell record={record} /> },
        { key: "name", label: "Product" },
        { key: "category", label: "Category" },
        { key: "price", label: "Price", render: (record) => currency(record.price) },
        { key: "availableQuantity", label: "Available" },
        { key: "soldQuantity", label: "Sold" },
        { key: "status", label: "Status", render: (record) => <StatusPill value={String(record.status)} /> },
      ]}
      detailFields={[
        { key: "name", label: "Product name" },
        { key: "category", label: "Category" },
        { key: "image", label: "Product image" },
        { key: "description", label: "Description" },
        { key: "price", label: "Price", render: (record) => currency(record.price) },
        { key: "availableQuantity", label: "Available quantity" },
        { key: "soldQuantity", label: "Sold orders" },
        { key: "status", label: "Publication status", render: (record) => <StatusPill value={String(record.status)} /> },
        { key: "createdAt", label: "Created", render: (record) => shortDate(record.createdAt) },
      ]}
    />
  )
}

export function StoreOrdersPage() {
  return (
    <CrudPage
      title="Store Orders"
      description="Review paid product orders and update fulfillment status."
      breadcrumb={["Dashboard", "Store", "Orders"]}
      endpoint="/api/v1/store/orders"
      dataKey="orders"
      recordName="order"
      searchPlaceholder="Search order number, customer, phone, product, or EVC reference"
      statusOptions={paymentStatusOptions}
      methodOptions={storeOrderStatusOptions}
      methodFilterLabel="All order statuses"
      showDateFilters
      allowCreate={false}
      allowDelete={false}
      defaultValues={{ orderStatus: "PROCESSING" }}
      fields={[
        { name: "orderStatus", label: "Order status", type: "select", options: storeOrderStatusOptions },
      ]}
      columns={[
        { key: "orderNumber", label: "Order number" },
        { key: "buyerName", label: "Customer" },
        { key: "buyerType", label: "Type", render: (record) => <StatusPill value={String(record.buyerType)} /> },
        { key: "product.name", label: "Product" },
        { key: "quantity", label: "Qty" },
        { key: "totalAmount", label: "Total", render: (record) => currency(record.totalAmount) },
        { key: "paymentStatus", label: "Payment", render: (record) => <StatusPill value={String(record.paymentStatus)} /> },
        { key: "orderStatus", label: "Order", render: (record) => <StatusPill value={String(record.orderStatus)} /> },
        { key: "evcTransactionReference", label: "EVC Ref", render: (record) => compactText(record.evcTransactionReference) },
        { key: "orderDate", label: "Order date", render: (record) => shortDate(record.orderDate) },
      ]}
      detailFields={[
        { key: "orderNumber", label: "Order number" },
        { key: "buyerName", label: "Customer name" },
        { key: "buyerType", label: "Customer type", render: (record) => <StatusPill value={String(record.buyerType)} /> },
        { key: "buyerPhoneNumber", label: "Phone number" },
        { key: "product.name", label: "Product" },
        { key: "quantity", label: "Quantity" },
        { key: "unitPrice", label: "Unit price", render: (record) => currency(record.unitPrice) },
        { key: "totalAmount", label: "Total amount", render: (record) => currency(record.totalAmount) },
        { key: "paymentMethod", label: "Payment method", render: (record) => <StatusPill value={String(record.paymentMethod)} /> },
        { key: "paymentStatus", label: "Payment status", render: (record) => <StatusPill value={String(record.paymentStatus)} /> },
        { key: "orderStatus", label: "Order status", render: (record) => <StatusPill value={String(record.orderStatus)} /> },
        { key: "evcTransactionReference", label: "EVC transaction reference" },
        { key: "orderDate", label: "Order date", render: (record) => shortDate(record.orderDate) },
        { key: "paidAt", label: "Paid at", render: (record) => shortDate(record.paidAt) },
      ]}
    />
  )
}

export function StoreTransactionsPage() {
  return (
    <CrudPage
      title="Store Transactions"
      description="View Waafi/EVC payment attempts for product purchases."
      breadcrumb={["Dashboard", "Store", "Transactions"]}
      endpoint="/api/v1/store/transactions"
      dataKey="transactions"
      recordName="transaction"
      searchPlaceholder="Search transaction, order number, customer, phone, or product"
      statusOptions={paymentStatusOptions}
      showDateFilters
      allowCreate={false}
      allowEdit={false}
      allowDelete={false}
      defaultValues={{}}
      fields={[]}
      columns={[
        { key: "transactionReference", label: "Transaction ref", render: (record) => compactText(record.transactionReference ?? record.requestId) },
        { key: "orderNumber", label: "Order number", render: (record) => compactText(record.orderNumber) },
        { key: "buyerName", label: "Customer" },
        { key: "buyerType", label: "Type", render: (record) => <StatusPill value={String(record.buyerType)} /> },
        { key: "phoneNumber", label: "Phone" },
        { key: "product.name", label: "Product" },
        { key: "amount", label: "Amount", render: (record) => currency(record.amount) },
        { key: "paymentStatus", label: "Status", render: (record) => <StatusPill value={String(record.paymentStatus)} /> },
        { key: "transactionDate", label: "Date", render: (record) => shortDate(record.transactionDate) },
      ]}
      detailFields={[
        { key: "transactionReference", label: "Transaction reference" },
        { key: "orderNumber", label: "Order number" },
        { key: "buyerName", label: "Customer" },
        { key: "buyerType", label: "Customer type", render: (record) => <StatusPill value={String(record.buyerType)} /> },
        { key: "phoneNumber", label: "Phone number" },
        { key: "product.name", label: "Product" },
        { key: "quantity", label: "Quantity" },
        { key: "amount", label: "Amount", render: (record) => currency(record.amount) },
        { key: "paymentMethod", label: "Payment method", render: (record) => <StatusPill value={String(record.paymentMethod)} /> },
        { key: "provider", label: "Provider" },
        { key: "paymentStatus", label: "Payment status", render: (record) => <StatusPill value={String(record.paymentStatus)} /> },
        { key: "requestId", label: "Request ID" },
        { key: "referenceId", label: "Reference ID" },
        { key: "invoiceId", label: "Invoice ID" },
        { key: "failedReason", label: "Failure reason" },
        { key: "transactionDate", label: "Transaction date", render: (record) => shortDate(record.transactionDate) },
      ]}
    />
  )
}
