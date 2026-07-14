"use client";

import { useState, useRef, useEffect } from "react";
import ConversationHistoryPanel from "@/components/admin/ConversationHistoryPanel";

interface Message {
  role: "user" | "assistant";
  content: string;
  time: string;
  category?: Category | null;
  activity?: { tool: string; label: string }[];
}

const TEAM = [
  { key: "photo", name: "Photo", emoji: "🎨", color: "photo", status: "Coming soon" },
  { key: "video", name: "Video", emoji: "🎬", color: "video", status: "Coming soon" },
  { key: "audio", name: "Audio", emoji: "🎙️", color: "audio", status: "Coming soon" },
  { key: "code", name: "Code", emoji: "💻", color: "code", status: "Coming soon" },
  { key: "blog", name: "Blog", emoji: "✍️", color: "blog", status: "Coming soon" },
  { key: "website", name: "Website", emoji: "🌐", color: "website", status: "Coming soon" },
] as const;

const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
  photo: { bg: "bg-photo/10", text: "text-photo", dot: "bg-photo" },
  video: { bg: "bg-video/10", text: "text-video", dot: "bg-video" },
  audio: { bg: "bg-audio/10", text: "text-audio", dot: "bg-audio" },
  code: { bg: "bg-code/10", text: "text-code", dot: "bg-code" },
  blog: { bg: "bg-blog/10", text: "text-blog", dot: "bg-blog" },
  website: { bg: "bg-website/10", text: "text-website", dot: "bg-website" },
};

const CATEGORIES = [
  { key: "image", label: "Image", emoji: "🎨", color: "photo" },
  { key: "video", label: "Video", emoji: "🎬", color: "video" },
  { key: "code", label: "Coding", emoji: "💻", color: "code" },
  { key: "blog", label: "Blogging", emoji: "✍️", color: "blog" },
] as const;

type Category = (typeof CATEGORIES)[number]["key"];

const categoryActiveClass: Record<string, string> = {
  photo: "bg-photo",
  video: "bg-video",
  code: "bg-code",
  blog: "bg-blog",
};

interface PendingChange {
  path: string;
  content: string;
  commitMessage: string;
  explanation: string;
}

function timestamp() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminConsole() {
  const [tab, setTab] = useState<"chat" | "dashboard">("chat");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Namaste! Main aapka CEO Agent hoon. Bataiye kya karna hai?",
      time: timestamp(),
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [applying, setApplying] = useState(false);
  const [pushResult, setPushResult] = useState<string | null>(null);
  const [tasks, setTasks] = useState<
    { id: string; title: string; status: string; priority: string }[]
  >([]);
  const [memory, setMemory] = useState<{ key: string; content: string }[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (tab !== "dashboard") return;
    setDashboardLoading(true);
    Promise.all([
      fetch("/api/ceo-tasks").then((r) => r.json()),
      fetch("/api/ceo-memory").then((r) => r.json()),
    ])
      .then(([taskData, memoryData]) => {
        setTasks(taskData.tasks || []);
        setMemory(memoryData.memory || []);
      })
      .catch(() => {})
      .finally(() => setDashboardLoading(false));
  }, [tab]);

  async function ensureConversation(firstMessageText: string): Promise<string> {
    if (conversationId) return conversationId;
    const title = firstMessageText.slice(0, 50) || "New chat";
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    setConversationId(data.conversation.id);
    return data.conversation.id;
  }

  function persistMessage(convoId: string, m: Message) {
    fetch(`/api/conversations/${convoId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: m.role,
        content: m.content,
        category: m.category ?? undefined,
        activity: m.activity ?? undefined,
      }),
    }).catch(() => {
      // Persistence failing shouldn't block the chat experience itself
    });
  }

  async function loadConversation(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();
      setConversationId(id);
      setMessages(
        (data.messages || []).map((m: {
          role: "user" | "assistant";
          content: string;
          category?: Category;
          activity?: { tool: string; label: string }[];
          createdAt: number;
        }) => ({
          role: m.role,
          content: m.content,
          category: m.category,
          activity: m.activity,
          time: new Date(m.createdAt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }))
      );
      setPendingChange(null);
      setPushResult(null);
    } catch {
      setError("Conversation load nahi ho payi.");
    } finally {
      setLoading(false);
    }
  }

  function startNewConversation() {
    setConversationId(null);
    setMessages([
      {
        role: "assistant",
        content: "Namaste! Main aapka CEO Agent hoon. Bataiye kya karna hai?",
        time: timestamp(),
      },
    ]);
    setPendingChange(null);
    setPushResult(null);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      role: "user",
      content: text,
      time: timestamp(),
      category: selectedCategory,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    const convoId = await ensureConversation(text).catch(() => null);
    if (convoId) persistMessage(convoId, userMsg);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
            category: m.category ?? undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Agent se jawab nahi aaya.");
      const assistantMsg: Message = {
        role: "assistant",
        content: data.reply,
        time: timestamp(),
        activity: data.activity,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (convoId) persistMessage(convoId, assistantMsg);
      if (data.pendingChange) {
        setPendingChange(data.pendingChange);
        setPushResult(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kuch galat ho gaya.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmChange() {
    if (!pendingChange) return;
    setApplying(true);
    setPushResult(null);
    try {
      const res = await fetch("/api/apply-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: pendingChange.path,
          content: pendingChange.content,
          commitMessage: pendingChange.commitMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Push fail ho gaya.");
      setPushResult("✅ Live push ho gaya! Vercel kuch minute mein website update kar dega.");
      setPendingChange(null);
    } catch (err: unknown) {
      setPushResult(
        `❌ ${err instanceof Error ? err.message : "Push fail ho gaya."}`
      );
    } finally {
      setApplying(false);
    }
  }

  function rejectChange() {
    setPendingChange(null);
    setPushResult(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <main className="min-h-screen flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <header className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-iris to-purple-500 flex items-center justify-center rotate-3 shadow-lg shadow-iris/30">
              <span className="text-base">👑</span>
            </div>
            <h1 className="font-display font-700 text-xl">CEO Agent</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setHistoryOpen(true)}
              className="text-xs text-slate/50 hover:text-slate"
            >
              📜 History
            </button>
            <button
              onClick={async () => {
                await fetch("/api/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="text-xs text-slate/50 hover:text-slate"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-ink/5 p-1 rounded-full">
          <button
            onClick={() => setTab("chat")}
            className={`flex-1 py-2 rounded-full text-sm font-display font-600 transition-colors ${
              tab === "chat" ? "bg-white shadow-sm text-iris" : "text-slate"
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setTab("dashboard")}
            className={`flex-1 py-2 rounded-full text-sm font-display font-600 transition-colors ${
              tab === "dashboard" ? "bg-white shadow-sm text-iris" : "text-slate"
            }`}
          >
            🗂️ Dashboard
          </button>
        </div>
      </header>

      {tab === "chat" ? (
        <>
          {/* Chat log */}
          <div className="flex-1 overflow-y-auto ledger-scroll px-5">
            <div className="py-4 space-y-5">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col animate-[fadeIn_0.25s_ease-out] ${m.role === "user" ? "items-end" : "items-start"}`}
                >
                  <span className="text-[11px] text-slate/60 mb-1 px-1">
                    {m.role === "user" ? "Aap" : "CEO Agent"} · {m.time}
                    {m.category && (
                      <span className="ml-1.5 text-iris">
                        · {CATEGORIES.find((c) => c.key === m.category)?.emoji}{" "}
                        {CATEGORIES.find((c) => c.key === m.category)?.label}
                      </span>
                    )}
                  </span>
                  <div
                    className={`px-4 py-2.5 max-w-[85%] whitespace-pre-wrap leading-relaxed rounded-2xl ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-iris to-purple-500 text-white rounded-br-md shadow-md shadow-iris/20"
                        : "bg-irissoft text-ink rounded-bl-md"
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.activity && m.activity.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5 max-w-[85%]">
                      {m.activity.map((a, ai) => (
                        <span
                          key={ai}
                          className="text-[10px] px-2 py-1 rounded-full bg-iris/10 text-iris"
                        >
                          {a.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex flex-col items-start">
                  <span className="text-[11px] text-slate/60 mb-1 px-1">CEO Agent</span>
                  <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-irissoft text-slate/50 italic">
                    soch raha hoon…
                  </div>
                </div>
              )}

              {error && (
                <div className="px-4 py-3 bg-audio/10 border border-audio/30 text-audio rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* Pending Change Confirmation Card */}
          {pendingChange && (
            <div className="mx-5 mb-3 bg-white rounded-2xl border-2 border-website p-4 shadow-sm">
              <p className="text-xs font-display font-600 text-website mb-2 uppercase tracking-wide">
                🌐 Website Change Proposal
              </p>
              <p className="text-sm text-ink mb-2">{pendingChange.explanation}</p>
              <div className="bg-cloud rounded-xl px-3 py-2 mb-3 font-mono text-xs text-slate overflow-x-auto">
                <p className="mb-1">
                  <span className="text-slate/60">File:</span> {pendingChange.path}
                </p>
                <p>
                  <span className="text-slate/60">Commit:</span> {pendingChange.commitMessage}
                </p>
              </div>
              {pushResult ? (
                <p className="text-sm">{pushResult}</p>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={confirmChange}
                    disabled={applying}
                    className="flex-1 py-2.5 rounded-xl bg-website text-white font-display font-600 text-sm disabled:opacity-50"
                  >
                    {applying ? "Pushing…" : "✅ Confirm & Push"}
                  </button>
                  <button
                    onClick={rejectChange}
                    disabled={applying}
                    className="px-4 py-2.5 rounded-xl bg-ink/5 text-slate font-display font-600 text-sm"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Category chips + Input */}
          <div className="px-5 py-4">
            <div className="flex gap-2 mb-2.5 overflow-x-auto">
              {CATEGORIES.map((c) => {
                const active = selectedCategory === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() =>
                      setSelectedCategory(active ? null : (c.key as Category))
                    }
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-display font-600 border transition-colors ${
                      active
                        ? `${categoryActiveClass[c.color]} text-white border-transparent`
                        : "bg-white text-slate border-ink/10"
                    }`}
                  >
                    <span>{c.emoji}</span>
                    {c.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-end gap-2 bg-white rounded-2xl p-2 shadow-sm border border-ink/5">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedCategory
                    ? `${CATEGORIES.find((c) => c.key === selectedCategory)?.label} ke liye kya chahiye?`
                    : "Kya karna hai bataiye…"
                }
                rows={1}
                className="flex-1 resize-none px-3 py-2 bg-transparent focus:outline-none placeholder:text-slate/40"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-iris to-purple-500 text-white flex items-center justify-center disabled:opacity-30 transition-all active:scale-90 shadow-md shadow-iris/30"
              >
                ➤
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Dashboard */
        <div className="flex-1 overflow-y-auto ledger-scroll px-5 py-4">
          {dashboardLoading && (
            <p className="text-xs text-slate/40 mb-3">Loading…</p>
          )}

          {/* Tasks */}
          <div className="mb-6">
            <p className="font-display font-600 text-sm mb-2">📋 Tasks</p>
            {tasks.length === 0 ? (
              <p className="text-xs text-slate/40">
                Koi task nahi hai abhi — chat mein CEO Agent khud task banata hai jab kaam soponge.
              </p>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white rounded-xl px-3.5 py-2.5 border border-ink/5 flex items-center justify-between"
                  >
                    <span className="text-sm">{t.title}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-600 ${
                        t.status === "done"
                          ? "bg-green-100 text-green-700"
                          : t.status === "in-progress"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-ink/5 text-slate"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Memory */}
          <div className="mb-6">
            <p className="font-display font-600 text-sm mb-2">🧠 Project Memory</p>
            {memory.length === 0 ? (
              <p className="text-xs text-slate/40">
                Abhi kuch yaad nahi hai — jaise-jaise baat karoge, CEO Agent zaroori cheezein yaad rakhega.
              </p>
            ) : (
              <div className="space-y-2">
                {memory.map((m) => (
                  <div key={m.key} className="bg-white rounded-xl px-3.5 py-2.5 border border-ink/5">
                    <p className="text-[10px] uppercase tracking-wide text-slate/40 mb-0.5">{m.key}</p>
                    <p className="text-sm">{m.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-sm text-slate mb-4">
            Aapki team — abhi sab agents baithe hain, jaise-jaise tools connect
            karte jaayenge, ye active ho jaayenge.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {TEAM.map((agent) => {
              const c = colorMap[agent.color];
              const card = (
                <div className="bg-white rounded-2xl p-4 border border-ink/5 shadow-sm h-full">
                  <div
                    className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center text-lg mb-3`}
                  >
                    {agent.emoji}
                  </div>
                  <p className="font-display font-600 text-sm mb-1">{agent.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot} opacity-40`} />
                    <span className="text-xs text-slate/60">
                      {agent.key === "website" ? "Tap to view →" : agent.status}
                    </span>
                  </div>
                </div>
              );
              return agent.key === "website" ? (
                <a key={agent.key} href="/site">
                  {card}
                </a>
              ) : (
                <div key={agent.key}>{card}</div>
              );
            })}
          </div>
        </div>
      )}

      <ConversationHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        activeId={conversationId}
        onSelect={loadConversation}
        onNew={startNewConversation}
      />
    </main>
  );
}
