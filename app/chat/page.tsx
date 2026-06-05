"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChartBlock } from "@/components/chat/chart-block";
import type { ConvItem, Message, ChartContent } from "@/components/chat/mock-data";

// ── Markdown inline : **gras** ────────────────────────────────────

function parseMd(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-(--color-fg)">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        )
      )}
    </>
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
              <p
                className={cn(
                  "rounded-(--radius-md) px-4 py-3 text-sm leading-[1.6]",
                  isUser
                    ? "bg-(--color-bg-muted) text-(--color-fg)"
                    : "border border-(--color-border) bg-(--color-bg-elevated) text-(--color-fg)"
                )}
              >
                {parseMd(block.text)}
              </p>
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

// ── Typing indicator ──────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-(--color-border) bg-(--color-bg-subtle)">
        <Bot className="h-3.5 w-3.5 text-(--color-fg-muted)" strokeWidth={1.5} />
      </div>
      <div className="flex items-center gap-1.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color-fg-subtle)"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
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
  const [isTyping, setIsTyping] = useState(false);
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

  // Si aucune conversation chargée depuis BQ, ouvrir un chat local vide
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
  }, [messages.length, isTyping]);

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
    if (!text || isTyping || !activeConvId) return;

    const conv = convItems.find((c) => c.id === activeConvId);
    const isNew = conv?.isLocal ?? false;
    const conversationTitle = text.slice(0, 60);

    // Mise à jour optimiste UI
    const userMsg: Message = {
      id: `local-${Date.now()}`,
      role: "user",
      blocks: [{ type: "text", text }],
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Marquer la conv comme persistée + mettre à jour son titre
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
        }),
      });

      const data: { messageId?: string; response?: string; timestamp?: string; error?: string } =
        await res.json();

      if (!res.ok || data.error) {
        const errMsg = data.error ?? `Erreur ${res.status}`;
        console.error("[chat] API error:", errMsg);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant" as const,
            blocks: [{ type: "text" as const, text: `⚠️ ${errMsg}` }],
            timestamp: new Date().toISOString(),
          },
        ]);
        return;
      }

      const assistantMsg: Message = {
        id: data.messageId!,
        role: "assistant",
        blocks: [{ type: "text", text: data.response! }],
        timestamp: data.timestamp!,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("[chat] Send error:", err);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, activeConvId, convItems]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeConv = convItems.find((c) => c.id === activeConvId);

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
          ) : !activeConvId || messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 px-6 py-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isTyping && <TypingIndicator />}
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
                disabled={!input.trim() || isTyping || !activeConvId}
                aria-label="Envoyer"
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-(--radius-sm) transition-colors duration-[--duration-base]",
                  input.trim() && !isTyping && activeConvId
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
