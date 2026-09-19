"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface HRCoachProps {
  teamId: string;
  roundId?: string;
}

const STARTER_PROMPTS = [
  "Why did my score change this round?",
  "What should I consider for next round?",
  "Why did my turnover rate move?",
];

/**
 * Streaming chat UI for the AI coach. Talks to POST /api/coach, which
 * streams plain text chunks back — appended to the last assistant message
 * as they arrive rather than waiting for the full reply.
 *
 * State is only ever set from user interaction or the fetch's own
 * response-reading loop (never from inside a useEffect), per this repo's
 * enforced no-setState-in-useEffect lint rule.
 */
export function HRCoach({ teamId, roundId }: HRCoachProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const historyRef = useRef<ChatMessage[]>([]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    setErrorText(null);
    const history = historyRef.current;
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: teamId,
          round_id: roundId,
          message: trimmed,
          history,
        }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        setErrorText(body.error ?? "The coach is unavailable right now.");
        setMessages((prev) => prev.slice(0, -1));
        setIsStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: assistantText };
          return next;
        });
      }

      historyRef.current = [
        ...history,
        userMsg,
        { role: "assistant", content: assistantText },
      ];
    } catch {
      setErrorText("The coach is unavailable right now. Please try again.");
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <section className="rounded-xl border border-[var(--portal-sidebar-border)] bg-[var(--portal-page)] p-5">
      <h3 className="font-semibold text-[var(--portal-title)]">HR Coach</h3>
      <p className="mt-1 text-sm text-[var(--portal-muted)]">
        Ask about your team&apos;s own results. The coach won&apos;t hand you a
        decision set — it&apos;ll help you reason about the numbers.
      </p>

      {messages.length === 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => sendMessage(label)}
              disabled={isStreaming}
              className="rounded-lg border border-[var(--portal-sidebar-border)] bg-white px-3 py-2 text-sm text-[var(--portal-ink)] hover:bg-[#f4f5f7] disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="mt-4 max-h-96 space-y-3 overflow-y-auto rounded-lg border border-[var(--portal-sidebar-border)] bg-white p-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-lg bg-[var(--portal-primary)] px-3 py-2 text-sm text-white"
                  : "mr-auto max-w-[85%] rounded-lg bg-[#f4f5f7] px-3 py-2 text-sm text-[var(--portal-ink)]"
              }
            >
              {m.content || (m.role === "assistant" && isStreaming ? "…" : "")}
            </div>
          ))}
        </div>
      )}

      {errorText && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {errorText}
        </p>
      )}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the HR Coach…"
          disabled={isStreaming}
          className="flex-1 rounded-lg border border-[var(--portal-sidebar-border)] px-3 py-2 text-sm outline-none focus:border-[var(--portal-primary)] disabled:opacity-50"
        />
        <Button type="submit" disabled={isStreaming || !input.trim()}>
          {isStreaming ? "Thinking…" : "Send"}
        </Button>
      </form>
    </section>
  );
}
