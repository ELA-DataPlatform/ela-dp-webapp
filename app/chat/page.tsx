"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChartBlock } from "@/components/chat/chart-block";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ConvItem, Message, ChartContent } from "@/components/chat/mock-data";

// ── Markdown renderer ─────────────────────────────────────────────

function MdContent({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 leading-[1.6]">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-(--color-fg)">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-(--color-fg-muted)">{children}</em>
        ),
        h1: ({ children }) => (
          <h1 className="mb-2 mt-4 text-base font-semibold tracking-[-0.02em] text-(--color-fg) first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 mt-3 text-sm font-semibold tracking-[-0.01em] text-(--color-fg) first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1.5 mt-3 text-sm font-medium text-(--color-fg) first:mt-0">
            {children}
          </h3>
        ),
        ul: ({ children }) => (
          <ul className="mb-2 space-y-1 pl-4 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="relative text-sm leading-[1.6] before:absolute before:-left-3 before:text-(--color-fg-subtle) before:content-['·']">
            {children}
          </li>
        ),
        code: ({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode }) =>
          inline ? (
            <code
              className="rounded px-1 py-0.5 font-mono text-[12px] bg-(--color-bg-muted) text-(--color-fg)"
              {...props}
            >
              {children}
            </code>
          ) : (
            <code className="block font-mono text-[12px] leading-relaxed" {...props}>
              {children}
            </code>
          ),
        pre: ({ children }) => (
          <pre className="mb-2 overflow-x-auto rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-subtle) px-4 py-3 last:mb-0">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-(--color-border-strong) pl-3 text-(--color-fg-muted) last:mb-0">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="mb-2 overflow-x-auto last:mb-0">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b border-(--color-border) bg-(--color-bg-subtle)">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-(--color-border) px-3 py-2 text-(--color-fg)">
            {children}
          </td>
        ),
        hr: () => <hr className="my-3 border-t border-(--color-border)" />,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-(--color-accent) underline underline-offset-2 hover:opacity-80"
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

// ── Message bubble ────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-(--color-border) bg-(--color-bg-subtle)">
          <Bot className="h-3.5 w-3.5 text-(--color-fg-muted)" strokeWidth={1.5} />
        </div>
      )}

      <div
        className={cn(
          "flex min-w-0 flex-col gap-3",
          isUser ? "max-w-[65%] items-end" : "max-w-[80%] items-start"
        )}
      >
        {message.blocks.map((block, i) => (
          <div key={i} className="w-full">
            {block.type === "text" && (
              <div
                className={cn(
                  "rounded-(--radius-md) px-4 py-3 text-sm",
                  isUser
                    ? "bg-(--color-bg-muted) text-(--color-fg)"
                    : "border border-(--color-border) bg-(--color-bg-elevated) text-(--color-fg)"
                )}
              >
                {isUser ? (
                  <p className="leading-[1.6]">{block.text}</p>
                ) : (
                  <MdContent text={block.text} />
                )}
              </div>
            )}
            {block.type === "chart" && (
              <ChartBlock block={block as ChartContent} />
            )}
          </div>
        ))}

        <span className="font-mono text-[11px] tabular-nums text-(--color-fg-subtle)">
          {new Date(message.timestamp).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

// ── Streaming bubble (pendant la génération) ──────────────────────

function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-(--color-border) bg-(--color-bg-subtle)">
        <Bot className="h-3.5 w-3.5 text-(--color-fg-muted)" strokeWidth={1.5} />
      </div>
      <div className="max-w-[80%]">
        <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) px-4 py-3 text-sm text-(--color-fg)">
          {text ? (
            <MdContent text={text} />
          ) : (
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color-fg-subtle)"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Empty / loading states ────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <Bot className="h-8 w-8 text-(--color-fg-subtle)" strokeWidth={1.5} />
      <p className="text-sm font-medium text-(--color-fg)">Comment puis-je vous aider ?</p>
      <p className="max-w-[280px] text-sm text-(--color-fg-muted)">
        Posez une question sur vos données d'entraînement, votre musique ou votre santé.
      </p>
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-6">
      {[{ w: "60%", side: "left" }, { w: "45%", side: "right" }, { w: "70%", side: "left" }].map(
        (item, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3",
              item.side === "right" ? "flex-row-reverse" : "flex-row"
            )}
          >
            {item.side === "left" && (
              <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-(--color-bg-muted)" />
            )}
            <div
              className="h-12 rounded-(--radius-md) bg-(--color-bg-muted)"
              style={{ width: item.w }}
            />
          </div>
        )
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function ChatPage() {
  const [convItems, setConvItems] = useState<ConvItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Charger les conversations depuis BQ
  useEffect(() => {
    fetch("/api/chat/conversations")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const items: ConvItem[] = data.map((c) => ({
          id: c.id,
          title: c.title,
          updatedAt: c.created_at,
        }));
        setConvItems(items);
        setActiveConvId(items[0].id);
      })
      .catch((err) => console.error("[chat] Load conversations:", err))
      .finally(() => setLoadingConvs(false));
  }, []);

  // Si aucune conversation chargée, ouvrir un chat local vide
  useEffect(() => {
    if (!loadingConvs && convItems.length === 0) {
      handleNewChat();
    }
  }, [loadingConvs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Charger les messages quand on change de conversation
  useEffect(() => {
    if (!activeConvId) return;
    const conv = convItems.find((c) => c.id === activeConvId);
    if (conv?.isLocal) {
      setMessages([]);
      return;
    }

    setLoadingMsgs(true);
    fetch(`/api/chat/conversations/${activeConvId}`)
      .then((r) => r.json())
      .then((data: unknown) => { if (Array.isArray(data)) setMessages(data); })
      .catch((err) => console.error("[chat] Load messages:", err))
      .finally(() => setLoadingMsgs(false));
  }, [activeConvId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streamingText]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const handleNewChat = useCallback(() => {
    const id = crypto.randomUUID();
    const newConv: ConvItem = {
      id,
      title: "Nouveau chat",
      updatedAt: new Date().toISOString(),
      isLocal: true,
    };
    setConvItems((prev) => [newConv, ...prev]);
    setActiveConvId(id);
    setMessages([]);
  }, []);

  const handleSelect = useCallback((id: string) => {
    setActiveConvId(id);
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streamingText !== null || !activeConvId) return;

    const conv = convItems.find((c) => c.id === activeConvId);
    const isNew = conv?.isLocal ?? false;
    const conversationTitle = text.slice(0, 60);

    // Historique pour le contexte de l'agent
    const history = messages
      .filter((m) => m.blocks.some((b) => b.type === "text"))
      .map((m) => ({
        role: m.role,
        content: m.blocks
          .filter((b) => b.type === "text")
          .map((b) => (b as { type: "text"; text: string }).text)
          .join("\n"),
      }));

    // Mise à jour optimiste UI
    const userMsg: Message = {
      id: `local-${Date.now()}`,
      role: "user",
      blocks: [{ type: "text", text }],
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreamingText(""); // démarre le streaming bubble (vide = dots)

    if (isNew) {
      setConvItems((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? { ...c, title: conversationTitle, isLocal: false }
            : c
        )
      );
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          conversationTitle,
          isNew,
          message: text,
          history,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({ error: `Erreur ${res.status}` }));
        throw new Error(data.error ?? `Erreur ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const raw = line.startsWith("data:") ? line.slice(5).trim() : line.trim();
          if (!raw) continue;
          try {
            const event = JSON.parse(raw) as {
              type: string;
              content?: string;
              messageId?: string;
              timestamp?: string;
              message?: string;
            };

            if (event.type === "chunk" && event.content) {
              accumulated += event.content;
              setStreamingText(accumulated);
            }

            if (event.type === "done") {
              const assistantMsg: Message = {
                id: event.messageId!,
                role: "assistant",
                blocks: [{ type: "text", text: accumulated }],
                timestamp: event.timestamp!,
              };
              setMessages((prev) => [...prev, assistantMsg]);
              setStreamingText(null);
            }

            if (event.type === "error") {
              throw new Error(event.message ?? "Erreur inconnue");
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[chat] Send error:", msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant" as const,
          blocks: [{ type: "text" as const, text: `⚠️ ${msg}` }],
          timestamp: new Date().toISOString(),
        },
      ]);
      setStreamingText(null);
    }
  }, [input, streamingText, activeConvId, convItems, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeConv = convItems.find((c) => c.id === activeConvId);
  const isStreaming = streamingText !== null;

  return (
    <div className="flex h-screen overflow-hidden">
      <ChatSidebar
        conversations={convItems}
        activeId={activeConvId}
        onSelect={handleSelect}
        onNew={handleNewChat}
        isLoading={loadingConvs}
      />

      {/* Zone principale */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center border-b border-(--color-border) px-6">
          <h1 className="text-sm font-semibold tracking-[-0.02em] text-(--color-fg)">
            {activeConv?.title ?? "Chat"}
          </h1>
        </div>

        {/* Messages */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {loadingMsgs ? (
            <MessagesSkeleton />
          ) : !activeConvId || (messages.length === 0 && !isStreaming) ? (
            <EmptyState />
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 px-6 py-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isStreaming && <StreamingBubble text={streamingText ?? ""} />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-(--color-border) px-6 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) px-4 py-3 transition-colors duration-[--duration-base] focus-within:border-(--color-accent)">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez une question sur vos données…"
                rows={1}
                className="min-h-[20px] flex-1 resize-none bg-transparent text-sm text-(--color-fg) placeholder:text-(--color-fg-subtle) focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming || !activeConvId}
                aria-label="Envoyer"
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-(--radius-sm) transition-colors duration-[--duration-base]",
                  input.trim() && !isStreaming && activeConvId
                    ? "bg-(--color-fg) text-(--color-bg) hover:opacity-90"
                    : "cursor-not-allowed text-(--color-fg-disabled)"
                )}
              >
                <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
            <p className="mt-2 text-center font-mono text-[11px] text-(--color-fg-subtle)">
              Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
