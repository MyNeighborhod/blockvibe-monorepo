import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ tenant: string }> }) {
  const cookieStore = await cookies()
  cookieStore.delete("payload-token")
  return NextResponse.json({ success: true })
}

export async function GET(request: Request, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params

  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    new URL(request.url).host
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http:" : "https:"
  const loginUrl = new URL(`/${tenant}/login`, `${protocol}//${host}`)

  // Do not clear cookies on GET — Next.js may prefetch linked /logout routes.
  return NextResponse.redirect(loginUrl)
}
