import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * FIREBASE ADMIN SDK — SERVER-SIDE ONLY
 * =======================================
 * This is a completely separate Firebase connection from lib/firebase.ts
 * (which is the public, client-side SDK used by Rangoli).
 *
 * This one uses a service account key and has FULL access to Firestore,
 * bypassing firestore.rules entirely. It must NEVER be imported into
 * any "use client" component — only into API route handlers
 * (app/api/**), which are already protected by middleware.ts's
 * ADMIN_PASSWORD check for the routes that use it.
 *
 * Env var needed: FIREBASE_SERVICE_ACCOUNT_KEY
 * (the full JSON content of a Firebase service account key file,
 * as a single-line string — see README for how to generate one)
 */

function getAdminDb() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY env var missing — CEO memory/tasks need this to work."
      );
    }
    const serviceAccount = JSON.parse(raw);
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

export function tryGetAdminDb() {
  try {
    return getAdminDb();
  } catch (e) {
    console.error("Firebase Admin init failed:", e);
    return null;
  }
}
