"use client";

import { useEffect, useState } from "react";

interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: number;
  archived: boolean;
  messageCount: number;
  lastMessagePreview?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export default function ConversationHistoryPanel({
  open,
  onClose,
  activeId,
  onSelect,
  onNew,
}: Props) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations?archived=${showArchived}`);
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch {
      // silent — history panel failing shouldn't block chat
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, showArchived]);

  async function handleRename(id: string) {
    if (!renameValue.trim()) return;
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: renameValue.trim() }),
    });
    setRenamingId(null);
    load();
  }

  async function handleArchive(id: string, archived: boolean) {
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    });
    load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleted: true }),
    });
    load();
  }

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="w-[85vw] max-w-sm bg-cloud h-full flex flex-col shadow-2xl animate-[fadeIn_0.2s_ease-out]">
        <div className="px-4 py-4 border-b border-ink/10 flex items-center justify-between">
          <p className="font-display font-700 text-lg">Conversations</p>
          <button onClick={onClose} className="text-slate/50 text-xl leading-none">×</button>
        </div>

        <div className="px-4 py-3 space-y-2">
          <button
            onClick={() => {
              onNew();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-br from-iris to-purple-500 text-white font-display font-600 text-sm"
          >
            + New chat
          </button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search conversations…"
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-ink/10 text-sm focus:outline-none focus:border-iris"
          />
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="text-xs text-iris"
          >
            {showArchived ? "Hide archived" : "Show archived"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto ledger-scroll px-4 pb-4 space-y-2">
          {loading && <p className="text-xs text-slate/40">Loading…</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-xs text-slate/40">Koi conversation nahi mili.</p>
          )}
          {filtered.map((c) => (
            <div
              key={c.id}
              className={`rounded-xl p-3 border ${
                c.id === activeId ? "border-iris bg-irissoft" : "border-ink/5 bg-white"
              }`}
            >
              {renamingId === c.id ? (
                <div className="flex gap-1.5">
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    autoFocus
                    className="flex-1 px-2 py-1 rounded-lg border border-ink/10 text-sm"
                  />
                  <button
                    onClick={() => handleRename(c.id)}
                    className="text-xs text-iris font-600"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onSelect(c.id);
                    onClose();
                  }}
                  className="text-left w-full"
                >
                  <p className="font-display font-600 text-sm truncate">{c.title}</p>
                  {c.lastMessagePreview && (
                    <p className="text-xs text-slate/50 truncate mt-0.5">
                      {c.lastMessagePreview}
                    </p>
                  )}
                </button>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => {
                    setRenamingId(c.id);
                    setRenameValue(c.title);
                  }}
                  className="text-[10px] text-slate/50"
                >
                  ✏️ Rename
                </button>
                <button
                  onClick={() => handleArchive(c.id, !c.archived)}
                  className="text-[10px] text-slate/50"
                >
                  {c.archived ? "📤 Unarchive" : "📥 Archive"}
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-[10px] text-red-400"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
