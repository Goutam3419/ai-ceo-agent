"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRangoliAuth } from "@/lib/rangoli-auth-context";
import { RANGOLI_CATEGORIES } from "@/lib/rangoli-categories";
import { RANGOLI_TEMPLATES } from "@/lib/rangoli-templates";

export default function RangoliHome() {
  const { user, loading, configError } = useRangoliAuth();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !user && !configError) router.push("/rangoli/login");
  }, [loading, user, configError, router]);

  if (configError) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-3xl mb-3">⚠️</p>
          <p className="font-rangoli font-700 mb-2">Firebase set nahi hui hai</p>
          <p className="text-sm text-rangoliink/60">
            Vercel ke Environment Variables mein Firebase keys add karo aur
            redeploy karo. README.md mein steps hain.
          </p>
        </div>
      </main>
    );
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-rangoliink/50">Loading…</p>
      </main>
    );
  }

  const filtered = RANGOLI_TEMPLATES.filter((t) => {
    const matchesCategory = !activeCategory || t.category === activeCategory;
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="max-w-2xl mx-auto px-5 pb-10">
      {/* Header */}
      <header className="flex items-center justify-between py-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌸</span>
          <h1 className="font-rangoli font-700 text-xl">Rangoli</h1>
        </div>
        <Link
          href="/rangoli/profile"
          className="w-9 h-9 rounded-full bg-rangolisoft flex items-center justify-center text-rangoli font-rangoli font-600 text-sm"
        >
          {(user.email || "U")[0].toUpperCase()}
        </Link>
      </header>

      {/* Search */}
      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  Kya banana hai?"
          className="w-full px-4 py-3.5 rounded-2xl bg-white border border-rangoliink/10 focus:outline-none focus:border-rangoli"
        />
      </div>

      {/* Categories */}
      <p className="font-rangoli font-600 text-sm mb-3">Categories</p>
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          onClick={() => setActiveCategory(null)}
          className={`rounded-2xl p-4 text-left border ${
            !activeCategory ? "border-rangoli bg-rangolisoft" : "border-rangoliink/10 bg-white"
          }`}
        >
          <p className="text-lg mb-1">✨</p>
          <p className="font-rangoli font-600 text-sm">Sab Templates</p>
        </button>
        {RANGOLI_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`rounded-2xl p-4 text-left text-white transition-transform active:scale-95 hover:-translate-y-0.5 shadow-md ${cat.colorClass} ${
              activeCategory === cat.key ? "ring-2 ring-offset-2 ring-rangoliink/30" : ""
            }`}
          >
            <p className="text-lg mb-1">{cat.emoji}</p>
            <p className="font-rangoli font-600 text-sm">{cat.name}</p>
          </button>
        ))}
      </div>

      {/* Template grid */}
      <p className="font-rangoli font-600 text-sm mb-3">Templates</p>
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((t) => (
          <Link
            key={t.id}
            href={`/rangoli/editor/${t.id}`}
            className="rounded-2xl overflow-hidden border border-rangoliink/10 bg-white transition-transform active:scale-95 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div
              className="h-28 flex items-center justify-center text-white text-xs px-2 text-center"
              style={{ backgroundColor: t.previewBg }}
            >
              {t.title}
            </div>
            <div className="p-2.5 flex items-center justify-between">
              <span className="text-xs text-rangoliink/60">{t.title}</span>
              {t.isPremium ? (
                <span className="text-[10px] bg-rangoli/10 text-rangoli px-1.5 py-0.5 rounded-full font-600">
                  💎 Pro
                </span>
              ) : (
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-600">
                  Free
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <button
        onClick={() => signOut(auth!)}
        className="mt-8 text-sm text-rangoliink/40"
      >
        Logout
      </button>
    </main>
  );
}
