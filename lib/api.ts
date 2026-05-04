export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })

  if (res.status === 401) {
    window.location.href = "/login"
    throw new Error("Non autorisé")
  }

  return res
}
