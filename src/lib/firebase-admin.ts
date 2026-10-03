/**
 * Firebase Admin SDK - server-only singleton.
 * Initialised lazily to prevent re-initialisation on hot-reload.
 */
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Use a global to survive Next.js hot-reload module cache resets.
const globalForFirebase = globalThis as typeof globalThis & {
  _firebaseApp?: App;
  _firestoreDb?: Firestore;
  _firestoreSettingsApplied?: boolean;
};

function getApp(): App {
  if (globalForFirebase._firebaseApp) return globalForFirebase._firebaseApp;
  if (getApps().length > 0) {
    globalForFirebase._firebaseApp = getApps()[0]!;
    return globalForFirebase._firebaseApp;
  }

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // .env stores literal \n; convert back to real newlines.
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase env vars missing. Set FIREBASE_PROJECT_ID, " +
      "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local"
    );
  }

  globalForFirebase._firebaseApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return globalForFirebase._firebaseApp;
}

/** Returns the Firestore instance (creates it once). */
export function getDb(): Firestore {
  if (globalForFirebase._firestoreDb) return globalForFirebase._firestoreDb;
  getApp();
  globalForFirebase._firestoreDb = getFirestore();
  // settings() must only be called once, before any other Firestore call.
  if (!globalForFirebase._firestoreSettingsApplied) {
    globalForFirebase._firestoreDb.settings({ ignoreUndefinedProperties: true });
    globalForFirebase._firestoreSettingsApplied = true;
  }
  return globalForFirebase._firestoreDb;
}


/** The initialised Admin app, for services other than Firestore (e.g. Storage). */
export function getFirebaseApp(): App {
  return getApp();
}
