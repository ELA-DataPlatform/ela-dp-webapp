import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GoogleAuth } from "google-auth-library"
import { NextRequest, NextResponse } from "next/server"

const auth = new GoogleAuth()

let cachedToken: { value: string; expiresAt: number } | null = null

async function getIdToken(audience: string): Promise<string> {
  // Reuse cached token if still valid (with 60s safety margin)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value
  }

  let token: string
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const keyFile = JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, "base64").toString("utf8")
    )
    const saAuth = new GoogleAuth({ credentials: keyFile })
    const client = await saAuth.getIdTokenClient(audience)
    const headers = await client.getRequestHeaders()
    const authHeader = headers instanceof Headers
      ? headers.get("Authorization")
      : (headers as Record<string, string>)["Authorization"]
    token = (authHeader ?? "").replace("Bearer ", "")
  } else {
    const client = await auth.getIdTokenClient(audience)
    const headers = await client.getRequestHeaders()
    const authHeader = headers instanceof Headers
      ? headers.get("Authorization")
      : (headers as Record<string, string>)["Authorization"]
    token = (authHeader ?? "").replace("Bearer ", "")
  }

  // Google ID tokens are valid for 1 hour
  cachedToken = { value: token, expiresAt: Date.now() + 3600_000 }
  return token
}

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const audience = process.env.NEXT_PUBLIC_API_URL
  if (!audience) {
    return NextResponse.json({ error: "NEXT_PUBLIC_API_URL non configurée" }, { status: 500 })
  }

  await params // resolve params (unused: path derived from req.nextUrl)
  const apiPath = req.nextUrl.pathname.replace(/^\/api\/proxy/, "")
  const upstreamUrl = `${audience}${apiPath}${req.nextUrl.search}`

  let token: string
  try {
    token = await getIdToken(audience)
  } catch (err) {
    console.error("[proxy] Échec identity token :", err)
    return NextResponse.json({ error: "Impossible d'obtenir un identity token" }, { status: 500 })
  }

  const upstream = await fetch(upstreamUrl, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
  })

  const data = await upstream.text()
  return new NextResponse(data, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
