import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { queryConversations } from "@/lib/bigquery";

export async function GET() {
  const isDev = process.env.NODE_ENV === "development";
  const session = await getServerSession(authOptions);
  if (!isDev && !session) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = session?.user?.email ?? "dev-user";

  try {
    const rows = await queryConversations(userId);
    return Response.json(rows);
  } catch (err) {
    console.error("[chat/conversations GET] BQ error:", err);
    return Response.json({ error: "Erreur lecture conversations" }, { status: 500 });
  }
}
