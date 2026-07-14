"use client";

import { useEffect, useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function PublicChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! Kaise madad kar sakta hoon?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/public-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "Sorry, kuch galat ho gaya." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, kuch galat ho gaya." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {open && (
        <div className="mb-3 w-[88vw] max-w-sm h-[70vh] max-h-[520px] rounded-3xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl shadow-black/20 flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-between">
            <p className="font-semibold text-sm">💬 Chat with us</p>
            <button onClick={() => setOpen(false)} className="text-white/80 text-lg leading-none">×</button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`px-3.5 py-2 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2 rounded-2xl bg-gray-100 text-gray-400 text-sm rounded-bl-sm">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                  </span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="p-2.5 border-t border-gray-100 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message…"
              className="flex-1 px-3.5 py-2.5 rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center disabled:opacity-30 shadow-lg shadow-indigo-500/30 transition-transform active:scale-90"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-2xl shadow-xl shadow-indigo-500/40 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      >
        {open ? "×" : "💬"}
      </button>
    </div>
  );
}
