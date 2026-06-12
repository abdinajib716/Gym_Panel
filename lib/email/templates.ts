type WelcomeMemberInput = {
  gymName: string
  name: string
  email?: string | null
  phone: string
  planName?: string | null
  subscriptionStatus?: string | null
  startDate?: Date | string | null
  expiryDate?: Date | string | null
  username: string
  temporaryPassword: string
}

type WelcomeTrainerInput = {
  gymName: string
  name: string
  email?: string | null
  phone: string
  specialty: string
  status: string
  username: string
  temporaryPassword: string
}

function formatDate(value?: Date | string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export function memberWelcomeEmail(input: WelcomeMemberInput) {
  const subject = `Welcome to ${input.gymName} - Your Member Account Details`
  const text = `Hello ${input.name},

Welcome to ${input.gymName}. Your membership account has been created successfully.

Here are your login details:

Name: ${input.name}
Email: ${input.email || "-"}
Phone: ${input.phone}
Membership Plan: ${input.planName || "-"}
Subscription Status: ${input.subscriptionStatus || "-"}
Start Date: ${formatDate(input.startDate)}
Expiry Date: ${formatDate(input.expiryDate)}

Login Details:

Username: ${input.username}
Temporary Password: ${input.temporaryPassword}

Please log in to the member mobile app and change your password after your first login.

Thank you,
${input.gymName}`

  return { subject, text }
}

export function trainerWelcomeEmail(input: WelcomeTrainerInput) {
  const subject = `Welcome to ${input.gymName} - Your Trainer Account Details`
  const text = `Hello ${input.name},

Welcome to ${input.gymName}. Your trainer account has been created successfully.

Here are your account details:

Name: ${input.name}
Email: ${input.email || "-"}
Phone: ${input.phone}
Specialty: ${input.specialty}
Status: ${input.status}

Login Details:

Username: ${input.username}
Temporary Password: ${input.temporaryPassword}

Please log in to the trainer mobile app and change your password after your first login.

Thank you,
${input.gymName}`

  return { subject, text }
}

export function adminPasswordResetEmail(input: {
  gymName: string
  name: string
  code: string
  expiresMinutes: number
}) {
  const subject = `${input.gymName} - Password Reset Code`
  const text = `Hello ${input.name},

We received a request to reset your admin password.

Reset code: ${input.code}

This code expires in ${input.expiresMinutes} minutes.

If you did not request this, you can ignore this email.

Thank you,
${input.gymName}`

  return { subject, text }
}
