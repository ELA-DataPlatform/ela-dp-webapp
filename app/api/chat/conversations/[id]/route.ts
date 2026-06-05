import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { queryMessages, type BlockRow } from "@/lib/bigquery";
import type { Message, ContentBlock } from "@/components/chat/mock-data";

function rowsToMessages(rows: BlockRow[]): Message[] {
  const map = new Map<string, Message>();

  for (const row of rows) {
    if (!map.has(row.message_id)) {
      map.set(row.message_id, {
        id: row.message_id,
        role: row.role as "user" | "assistant",
        blocks: [],
        timestamp: row.message_created_at,
      });
    }
    const msg = map.get(row.message_id)!;
    msg.blocks[row.position] = JSON.parse(row.content) as ContentBlock;
  }

  return Array.from(map.values());
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isDev = process.env.NODE_ENV === "development";
  const session = await getServerSession(authOptions);
  if (!isDev && !session) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const rows = await queryMessages(id);
    return Response.json(rowsToMessages(rows));
  } catch (err) {
    console.error("[chat/conversations/[id] GET] BQ error:", err);
    return Response.json({ error: "Erreur lecture messages" }, { status: 500 });
  }
}
