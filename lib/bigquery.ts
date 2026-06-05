import { BigQuery } from "@google-cloud/bigquery";
import { randomUUID } from "crypto";
import type { ContentBlock } from "@/components/chat/mock-data";

// ── Client ────────────────────────────────────────────────────────

function getCredentials() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) return undefined;
  return JSON.parse(Buffer.from(key, "base64").toString("utf8"));
}

const bq = new BigQuery({
  projectId: process.env.BIGQUERY_PROJECT_ID,
  credentials: getCredentials(),
});

function tbl(name: string) {
  return `\`${process.env.BIGQUERY_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.${name}\``;
}

function table(name: string) {
  return bq.dataset(process.env.BIGQUERY_DATASET!).table(name);
}

export const newId = () => randomUUID();

// ── Inserts ───────────────────────────────────────────────────────

export async function insertConversation(data: {
  id: string;
  userId: string;
  title: string;
}) {
  await table("normalized_conversations").insert([
    {
      id: data.id,
      user_id: data.userId,
      title: data.title,
      created_at: BigQuery.timestamp(new Date()),
    },
  ]);
}

export async function insertMessage(data: {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
}) {
  await table("normalized_messages").insert([
    {
      id: data.id,
      conversation_id: data.conversationId,
      role: data.role,
      created_at: BigQuery.timestamp(new Date()),
    },
  ]);
}

export async function insertBlock(data: {
  id: string;
  messageId: string;
  conversationId: string;
  position: number;
  type: string;
  block: ContentBlock;
}) {
  await table("normalized_message_blocks").insert([
    {
      id: data.id,
      message_id: data.messageId,
      conversation_id: data.conversationId,
      position: data.position,
      type: data.type,
      content: JSON.stringify(data.block),
      created_at: BigQuery.timestamp(new Date()),
    },
  ]);
}

// ── Queries ───────────────────────────────────────────────────────

export interface ConvRow {
  id: string;
  title: string;
  created_at: string;
}

export async function queryConversations(userId: string): Promise<ConvRow[]> {
  const [rows] = await bq.query({
    query: `
      SELECT id, title, CAST(created_at AS STRING) AS created_at
      FROM ${tbl("normalized_conversations")}
      WHERE user_id = @userId
      ORDER BY created_at DESC
      LIMIT 50
    `,
    params: { userId },
  });
  return rows as ConvRow[];
}

export interface BlockRow {
  message_id: string;
  role: string;
  message_created_at: string;
  position: number;
  type: string;
  content: string;
}

export async function queryMessages(conversationId: string): Promise<BlockRow[]> {
  const [rows] = await bq.query({
    query: `
      SELECT
        m.id         AS message_id,
        m.role,
        CAST(m.created_at AS STRING) AS message_created_at,
        mb.position,
        mb.type,
        mb.content
      FROM ${tbl("normalized_messages")} m
      JOIN ${tbl("normalized_message_blocks")} mb ON mb.message_id = m.id
      WHERE m.conversation_id = @conversationId
      ORDER BY m.created_at ASC, mb.position ASC
    `,
    params: { conversationId },
  });
  return rows as BlockRow[];
}
