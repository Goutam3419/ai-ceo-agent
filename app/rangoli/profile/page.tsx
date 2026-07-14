"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRangoliAuth } from "@/lib/rangoli-auth-context";

export default function RangoliProfile() {
  const { user, loading, configError } = useRangoliAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && !configError) router.push("/rangoli/login");
  }, [loading, user, configError, router]);

  if (configError) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <p className="text-sm text-rangoliink/60">
          ⚠️ Firebase set nahi hui hai. README.md dekho.
        </p>
      </main>
    );
  }

  if (loading || !user) return null;

  return (
    <main className="max-w-md mx-auto px-5 py-8">
      <Link href="/rangoli" className="text-sm text-rangoliink/50 mb-6 inline-block">
        ← Back
      </Link>

      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-rangolisoft flex items-center justify-center text-rangoli font-rangoli font-700 text-3xl mx-auto mb-3">
          {(user.email || "U")[0].toUpperCase()}
        </div>
        <p className="font-rangoli font-700 text-lg">{user.email}</p>
      </div>

      <div className="space-y-3">
        <div className="bg-white rounded-2xl p-4 border border-rangoliink/10 flex items-center justify-between">
          <span className="font-rangoli font-600 text-sm">📁 My Designs</span>
          <span className="text-xs text-rangoliink/40">Coming soon</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-rangoliink/10 flex items-center justify-between">
          <span className="font-rangoli font-600 text-sm">💎 My Purchases</span>
          <span className="text-xs text-rangoliink/40">Coming soon</span>
        </div>
        <button
          onClick={() => signOut(auth!).then(() => router.push("/rangoli/login"))}
          className="w-full bg-white rounded-2xl p-4 border border-rangoliink/10 text-left text-red-500 font-rangoli font-600 text-sm"
        >
          🚪 Logout
        </button>
      </div>
    </main>
  );
}
