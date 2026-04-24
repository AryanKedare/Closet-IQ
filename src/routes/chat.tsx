import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({ component: ChatPage });

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What should I wear for a dinner date tonight?",
  "What goes with my brown leather jacket?",
  "Give me a smart-casual outfit for tomorrow",
  "What are my most versatile items?",
  "What shoes work best for going out?",
];

async function streamChat(
  message: string,
  history: Message[],
  wardrobeContext: string,
  onDelta: (c: string) => void,
  onDone: () => void,
  onError: (e: string) => void
) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, wardrobeContext }),
  });
  if (!res.ok || !res.body) {
    const txt = await res.text();
    onError(txt || `HTTP ${res.status}`);
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;
  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const c = parsed.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch { }
    }
  }
  onDone();
}

function ChatPage() {
  const items = useStore((s) => s.items);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hey! I know your wardrobe inside out. Ask me anything — what to wear today, how to style a specific piece, or what to buy next." },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const wardrobeContext = useMemo(() => {
    return items
      .map((i) => `- ${i.name} (${i.category}, ${i.colorFamily}, ${i.pattern}${i.isStored ? ", in storage" : ""})`)
      .join("\n");
  }, [items]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    await streamChat(
      text,
      messages,
      wardrobeContext,
      (chunk) => setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + chunk };
        return copy;
      }),
      () => setStreaming(false),
      (err) => {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: `Sorry, something went wrong: ${err}` };
          return copy;
        });
        setStreaming(false);
      }
    );
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      <div className="flex-none">
        <h1 className="text-3xl font-bold tracking-tight">Stylist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your AI stylist who knows every item in your wardrobe
        </p>
      </div>

      {/* Messages */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="mr-2 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card border border-border rounded-bl-sm"
              )}
            >
              {msg.content}
              {streaming && i === messages.length - 1 && msg.role === "assistant" && (
                <span className="ml-0.5 inline-block h-3.5 w-1 animate-pulse bg-primary" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions (show only at start) */}
      {messages.length <= 1 && (
        <div className="flex-none mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex-none mt-3">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex items-center gap-2 rounded-xl border border-border bg-card p-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your stylist anything…"
            disabled={streaming}
            className="flex-1 bg-transparent px-2 py-1 text-sm placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
