import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GoogleAuth } from "google-auth-library";
import {
  insertConversation,
  insertMessage,
  insertBlock,
  newId,
} from "@/lib/bigquery";

// ── Agent identity token (cached per worker) ──────────────────────

const agentAuth = new GoogleAuth();
let agentToken: { value: string; expiresAt: number } | null = null;

async function getAgentToken(): Promise<string> {
  if (agentToken && Date.now() < agentToken.expiresAt - 60_000) {
    return agentToken.value;
  }

  const audience = process.env.AGENTS_API_URL!;
  let token: string;

  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const creds = JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, "base64").toString("utf8")
    );
    const client = await new GoogleAuth({ credentials: creds }).getIdTokenClient(audience);
    const h = await client.getRequestHeaders();
    const raw = h instanceof Headers ? h.get("Authorization") : (h as Record<string, string>)["Authorization"];
    token = (raw ?? "").replace("Bearer ", "");
  } else {
    const client = await agentAuth.getIdTokenClient(audience);
    const h = await client.getRequestHeaders();
    const raw = h instanceof Headers ? h.get("Authorization") : (h as Record<string, string>)["Authorization"];
    token = (raw ?? "").replace("Bearer ", "");
  }

  agentToken = { value: token, expiresAt: Date.now() + 3_600_000 };
  return token;
}

// ── Agent call ────────────────────────────────────────────────────

interface HistoryItem {
  role: "user" | "assistant";
  content: string;
}

async function callAgent(message: string, history: HistoryItem[]): Promise<string> {
  const url = process.env.AGENTS_API_URL!;
  const token = await getAgentToken();

  const res = await fetch(`${url}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, history, days: 30 }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Agent ${res.status}: ${body}`);
  }

  // Lire le stream SSE et collecter les chunks de texte
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const raw = line.startsWith("data:") ? line.slice(5).trim() : line.trim();
      if (!raw) continue;
      try {
        const event = JSON.parse(raw) as { type: string; content?: string };
        if (event.type === "text" && event.content) fullText += event.content;
        if (event.type === "done") { streamDone = true; break; }
      } catch {
        // ligne non-JSON, on ignore
      }
    }
  }

  if (!fullText) throw new Error("Réponse agent vide");
  return fullText;
}

// ── Handler ───────────────────────────────────────────────────────

export async function POST(req: Request) {
  const isDev = process.env.NODE_ENV === "development";
  const session = await getServerSession(authOptions);
  if (!isDev && !session) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = session?.user?.email ?? "dev-user";

  const {
    conversationId,
    conversationTitle,
    isNew,
    message,
    history = [],
  }: {
    conversationId: string;
    conversationTitle?: string;
    isNew?: boolean;
    message: string;
    history?: HistoryItem[];
  } = await req.json();

  if (!conversationId || !message) {
    return Response.json({ error: "conversationId et message requis" }, { status: 400 });
  }

  try {
    // 1. Créer la conversation si c'est un nouveau chat
    if (isNew) {
      console.log("[chat/POST] insertConversation", conversationId);
      await insertConversation({
        id: conversationId,
        userId,
        title: conversationTitle ?? message.slice(0, 60),
      });
    }

    // 2. Sauvegarder le message utilisateur
    console.log("[chat/POST] insertMessage user");
    const userMsgId = newId();
    await insertMessage({ id: userMsgId, conversationId, role: "user" });
    await insertBlock({
      id: newId(),
      messageId: userMsgId,
      conversationId,
      position: 0,
      type: "text",
      block: { type: "text", text: message },
    });

    // 3. Appeler l'agent
    console.log("[chat/POST] callAgent");
    const response = await callAgent(message, history);

    // 4. Sauvegarder la réponse assistant
    console.log("[chat/POST] insertMessage assistant");
    const asstMsgId = newId();
    const timestamp = new Date().toISOString();
    await insertMessage({ id: asstMsgId, conversationId, role: "assistant" });
    await insertBlock({
      id: newId(),
      messageId: asstMsgId,
      conversationId,
      position: 0,
      type: "text",
      block: { type: "text", text: response },
    });

    return Response.json({ messageId: asstMsgId, response, timestamp });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[chat/POST] error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
