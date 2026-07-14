"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login fail ho gaya.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kuch galat ho gaya.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-iris flex items-center justify-center mx-auto mb-5 rotate-3">
          <span className="text-2xl">👑</span>
        </div>
        <h1 className="font-display font-700 text-2xl mb-1">Private Office</h1>
        <p className="text-slate text-sm mb-6">
          Sirf tumhare liye — password daalo andar jaane ke liye.
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full px-4 py-3 rounded-2xl bg-white border border-ink/10 focus:outline-none focus:border-iris text-center mb-3 shadow-sm"
        />

        {error && <p className="text-audio text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full py-3 rounded-2xl bg-iris text-white font-display font-600 disabled:opacity-30 transition-opacity"
        >
          {loading ? "Checking…" : "Andar jaao →"}
        </button>
      </form>
    </main>
  );
}
