"use client"

import { CrudPage, StatusPill, currency, shortDate } from "@/components/gym/crud-page"

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
  { label: "Single member", value: "SINGLE_MEMBER" },
]

const readStatusOptions = [
  { label: "Unread", value: "UNREAD" },
  { label: "Read", value: "READ" },
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
        { name: "profileImage", label: "Profile image URL", section: "Member details" },
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
        { key: "fullName", label: "Name" },
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
        { key: "rawResponse", label: "Raw Waafi Response", render: (record) => jsonBlock(record.rawResponse) },
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
        status: "ACTIVE",
      }}
      fields={[
        { name: "fullName", label: "Full name" },
        { name: "phoneNumber", label: "Phone number" },
        { name: "email", label: "Email", type: "email" },
        { name: "gender", label: "Gender", type: "select", options: genderOptions },
        { name: "specialty", label: "Specialty" },
        { name: "availability", label: "Availability" },
        { name: "status", label: "Status", type: "select", options: activeOptions },
      ]}
      columns={[
        { key: "fullName", label: "Name" },
        { key: "phoneNumber", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "specialty", label: "Specialty" },
        { key: "availability", label: "Availability" },
        { key: "status", label: "Status", render: (record) => <StatusPill value={String(record.status)} /> },
      ]}
    />
  )
}
