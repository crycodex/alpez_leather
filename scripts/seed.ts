/**
 * Copia el contenido inicial a Firestore.
 *   npm run seed            → crea solo lo que no existe
 *   npm run seed -- --force → sobrescribe todo con los valores por defecto
 */
import { getDb } from '../src/lib/server/firebase-admin';
import {
  defaultAbout,
  defaultCategories,
  defaultFaq,
  defaultHome,
  defaultLegal,
  defaultProducts,
  defaultSettings,
} from '../src/data/defaults';

const force = process.argv.includes('--force');
const db = getDb();
if (!db) {
  console.error('✖ Firebase no está configurado. Revisa FIREBASE_* en .env (o FIRESTORE_EMULATOR_HOST).');
  process.exit(1);
}

async function put(path: string, data: object) {
  const ref = db!.doc(path);
  if (!force && (await ref.get()).exists) return console.log(`  · ${path} (ya existe)`);
  await ref.set(data);
  console.log(`  ✓ ${path}`);
}

const now = Date.now();
await put('settings/site', defaultSettings);
await put('content/home', defaultHome);
await put('content/about', defaultAbout);
await put('content/faq', defaultFaq);
await put('content/legal', defaultLegal);
for (const { id, ...c } of defaultCategories) await put(`categories/${id}`, c);
for (const { id, ...p } of defaultProducts) await put(`products/${id}`, { ...p, createdAt: now, updatedAt: now });
console.log('Listo.');
process.exit(0);
