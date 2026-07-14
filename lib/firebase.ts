"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

// Ye keys "public" hoti hain (browser mein dikhti hain) — Firebase isi tarah
// design hua hai, security asli mein Firebase Console ke "rules" se hoti hai,
// isliye NEXT_PUBLIC_ prefix zaroori hai taaki Next.js inhe browser tak bheje.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// IMPORTANT: Firebase sirf browser mein initialize hota hai, kabhi build/server
// ke waqt nahi — isse Vercel build crash nahi hoga chahe keys missing hon ya
// abhi tak Environment Variables mein na daali gayi hon.
function initAuth(): Auth | null {
  try {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    return getAuth(app);
  } catch (e) {
    console.error("Firebase init failed:", e);
    return null;
  }
}

export const auth: Auth | null =
  typeof window !== "undefined" ? initAuth() : null;
export const firebaseConfigured = Boolean(firebaseConfig.apiKey);

