import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { testFirebaseConnection } from "@/lib/firebase-push"

export async function POST(_request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("settings.update")
    const result = await testFirebaseConnection()

    await createActivityLog({
      type: "settings",
      activity: "Tested Firebase push notification connection",
      subject: "Firebase Config",
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
      metadata: result,
    })

    return result
  }, { path: "/api/v1/access-control/settings/test-firebase", method: "POST" })
}
