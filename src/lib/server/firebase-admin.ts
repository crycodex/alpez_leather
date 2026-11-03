/**
 * Firebase Admin SDK (solo servidor).
 * Si no hay credenciales ni emulador, `getDb()` devuelve null y el sitio
 * funciona en "modo demo" con el contenido de src/data/defaults.ts.
 */
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

const env = (k: string) => (import.meta.env?.[k] as string | undefined) ?? process.env[k];

let app: App | null | undefined;

function init(): App | null {
  if (app !== undefined) return app;
  const projectId = env('FIREBASE_PROJECT_ID') || env('PUBLIC_FIREBASE_PROJECT_ID');
  const clientEmail = env('FIREBASE_CLIENT_EMAIL');
  const privateKey = env('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
  const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

  if (getApps().length) {
    app = getApps()[0]!;
  } else if (projectId && clientEmail && privateKey) {
    app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
      storageBucket: env('FIREBASE_STORAGE_BUCKET'),
    });
  } else if (usingEmulator && projectId) {
    app = initializeApp({ projectId });
  } else {
    app = null;
  }
  return app;
}

export function getDb(): Firestore | null {
  const a = init();
  if (!a) return null;
  const dbId = env('FIREBASE_DATABASE_ID') || env('PUBLIC_FIREBASE_DATABASE_ID');
  return dbId && dbId !== '(default)' ? getFirestore(a, dbId) : getFirestore(a);
}

export function getAdminAuth(): Auth | null {
  const a = init();
  return a ? getAuth(a) : null;
}

export const isFirebaseConfigured = () => init() !== null;
