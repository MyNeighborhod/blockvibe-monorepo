import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import type { User } from "../payload-types"
import { getClientSideURL } from "./getURL"

export const getMeUser = async (args?: {
  nullUserRedirect?: string
  validUserRedirect?: string
}): Promise<{
  token: string
  user: User
}> => {
  const { nullUserRedirect, validUserRedirect } = args || {}
  const cookieStore = await cookies()
  const token = cookieStore.get("payload-token")?.value

  let serverUrl = "http://localhost:3000"
  try {
    const host = (await headers()).get("host")
    if (host) {
      const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http:" : "https:"
      serverUrl = `${protocol}//${host}`
    }
  } catch (e) {
    serverUrl = "http://localhost:3000"
  }

  const meUserReq = await fetch(`${serverUrl}/api/users/me?depth=1`, {
    headers: {
      Authorization: `JWT ${token}`,
      Cookie: `payload-token=${token}`,
    },
  })

  const {
    user,
  }: {
    user: User
  } = await meUserReq.json()

  console.log(
    `[getMeUser] Token exists: ${!!token}, Status: ${meUserReq.status}, User: ${user?.email || "none"}, URL: ${serverUrl}/api/users/me`,
  )

  if (validUserRedirect && meUserReq.ok && user) {
    console.log(`[getMeUser] Redirecting to validUserRedirect: ${validUserRedirect}`)
    redirect(validUserRedirect)
  }

  if (nullUserRedirect && (!meUserReq.ok || !user)) {
    console.log(
      `[getMeUser] Redirecting to nullUserRedirect: ${nullUserRedirect} (ok: ${meUserReq.ok}, user: ${!!user})`,
    )
    redirect(nullUserRedirect)
  }

  // Token will exist here because if it doesn't the user will be redirected
  return {
    token: token!,
    user,
  }
}
