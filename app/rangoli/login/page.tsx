"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, firebaseConfigured } from "@/lib/firebase";

export default function RangoliLoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!auth) {
      setError("Firebase set nahi hui hai. README.md dekho setup ke liye.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push("/rangoli");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message.replace("Firebase: ", "") : "Kuch galat ho gaya.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-full bg-rangoli flex items-center justify-center mx-auto mb-4 text-2xl">
          🌸
        </div>
        <h1 className="font-rangoli font-700 text-2xl mb-1">Rangoli</h1>
        <p className="text-sm text-rangoliink/60 mb-6">
          {mode === "login" ? "Wapas swagat hai!" : "Naya account banao"}
        </p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full px-4 py-3 rounded-xl bg-white border border-rangoliink/10 focus:outline-none focus:border-rangoli mb-3"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          minLength={6}
          className="w-full px-4 py-3 rounded-xl bg-white border border-rangoliink/10 focus:outline-none focus:border-rangoli mb-3"
        />

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-rangoli text-white font-rangoli font-600 disabled:opacity-50 mb-4"
        >
          {loading ? "Please wait…" : mode === "login" ? "Login" : "Sign up"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-sm text-rangoli"
        >
          {mode === "login"
            ? "Account nahi hai? Sign up karo"
            : "Already account hai? Login karo"}
        </button>
      </form>
    </main>
  );
}
