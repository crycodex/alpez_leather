/** Firebase en el navegador (solo panel admin). */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';

const config = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
  measurementId: import.meta.env.PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
};

const useEmulators = import.meta.env.PUBLIC_USE_FIREBASE_EMULATORS === 'true';
export const firebaseConfigured = Boolean(config.projectId && (config.apiKey || useEmulators));

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

export function fb() {
  if (!firebaseConfigured) throw new Error('Firebase no está configurado');
  if (!app) {
    app = getApps()[0] ?? initializeApp({ ...config, apiKey: config.apiKey || 'demo-key' });
    auth = getAuth(app);
    const dbId = import.meta.env.PUBLIC_FIREBASE_DATABASE_ID;
    db = dbId && dbId !== '(default)' && !useEmulators ? getFirestore(app, dbId) : getFirestore(app);
    storage = getStorage(app);
    if (useEmulators) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectStorageEmulator(storage, '127.0.0.1', 9199);
    }
  }
  return { app, auth, db, storage };
}
