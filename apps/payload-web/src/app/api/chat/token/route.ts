import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getMeUser } from "@/utilities/getMeUser"

export async function GET() {
  try {
    // Retrieve currently logged-in user in Payload CMS
    const meResult = await getMeUser()
    const user = meResult?.user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const secret = process.env.CHAT_SERVICE_SIGNING_SECRET
    if (!secret) {
      console.error("CHAT_SERVICE_SIGNING_SECRET is not configured.")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Sign a short-lived token for the chat microservice (15 minutes expiry)
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role || "resident",
        email: user.email,
      },
      secret,
      { expiresIn: "15m" }
    )

    return NextResponse.json({ token })
  } catch (err: any) {
    console.warn("[chat/token API] Error fetching user or signing token:", err.message)
    return NextResponse.json({ error: "Unauthorized or session expired" }, { status: 401 })
  }
}
