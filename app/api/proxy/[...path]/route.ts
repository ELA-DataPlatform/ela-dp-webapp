import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GoogleAuth } from "google-auth-library"
import { NextRequest, NextResponse } from "next/server"

const auth = new GoogleAuth()

async function getIdToken(audience: string): Promise<string> {
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
    return (authHeader ?? "").replace("Bearer ", "")
  }

  const client = await auth.getIdTokenClient(audience)
  const headers = await client.getRequestHeaders()
  const authHeader = headers instanceof Headers
    ? headers.get("Authorization")
    : (headers as Record<string, string>)["Authorization"]
  return (authHeader ?? "").replace("Bearer ", "")
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

  const { path } = await params
  const upstreamUrl = `${audience}/${path.join("/")}${req.nextUrl.search}`

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
