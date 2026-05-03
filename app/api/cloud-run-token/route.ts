import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GoogleAuth } from "google-auth-library"
import { NextResponse } from "next/server"

// Singleton pour bénéficier du cache de token interne à GoogleAuth
const auth = new GoogleAuth()

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const audience = process.env.NEXT_PUBLIC_API_URL
  if (!audience) {
    return NextResponse.json({ error: "NEXT_PUBLIC_API_URL non configurée" }, { status: 500 })
  }

  // Si GOOGLE_SERVICE_ACCOUNT_KEY est définie (déploiement), on l'utilise
  // Sinon GoogleAuth tombe sur les Application Default Credentials (gcloud auth application-default login)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const keyFile = JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, "base64").toString("utf8")
    )
    const saAuth = new GoogleAuth({ credentials: keyFile })
    const client = await saAuth.getIdTokenClient(audience)
    const headers = await client.getRequestHeaders()
    const authHeader = headers instanceof Headers ? headers.get("Authorization") : (headers as Record<string, string>)["Authorization"]
    const token = (authHeader ?? "").replace("Bearer ", "")
    return NextResponse.json({ token })
  }

  try {
    const client = await auth.getIdTokenClient(audience)
    const headers = await client.getRequestHeaders()
    const authHeader = headers instanceof Headers ? headers.get("Authorization") : (headers as Record<string, string>)["Authorization"]
    const token = (authHeader ?? "").replace("Bearer ", "")
    return NextResponse.json({ token })
  } catch (err) {
    console.error("[cloud-run-token] Échec récupération identity token :", err)
    return NextResponse.json(
      { error: "Impossible d'obtenir un identity token. Vérifier les credentials GCP." },
      { status: 500 }
    )
  }
}
