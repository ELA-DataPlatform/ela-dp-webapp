const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

async function fetchCloudRunToken(): Promise<string> {
  const res = await fetch("/api/cloud-run-token")
  if (res.status === 401) {
    window.location.href = "/login"
    throw new Error("Session expirée")
  }
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error ?? "Impossible d'obtenir le token")
  }
  const { token } = await res.json()
  return token as string
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await fetchCloudRunToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 401) {
    window.location.href = "/login"
    throw new Error("Non autorisé")
  }

  return res
}
