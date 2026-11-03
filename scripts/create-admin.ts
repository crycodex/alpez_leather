/**
 * Crea (o promueve) un administrador del panel.
 *   npm run create-admin -- correo@ejemplo.com "contraseña-segura"
 * Si el usuario ya existe en Firebase Auth, solo lo marca como admin.
 */
import { getAdminAuth, getDb } from '../src/lib/server/firebase-admin';

const [email, password] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!email) {
  console.error('Uso: npm run create-admin -- correo@ejemplo.com "contraseña"');
  process.exit(1);
}
const auth = getAdminAuth();
const db = getDb();
if (!auth || !db) {
  console.error('✖ Firebase no está configurado. Revisa FIREBASE_* en .env.');
  process.exit(1);
}

let user;
try {
  user = await auth.getUserByEmail(email);
  console.log(`· El usuario ${email} ya existe`);
} catch {
  if (!password || password.length < 8) {
    console.error('✖ El usuario no existe: indica una contraseña de al menos 8 caracteres.');
    process.exit(1);
  }
  user = await auth.createUser({ email, password, emailVerified: true });
  console.log(`✓ Usuario creado: ${email}`);
}
// Claim para las reglas de Storage (no pueden leer una base de Firestore con nombre)
await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: true });
await db.collection('admins').doc(user.uid).set({ email, role: 'owner', createdAt: Date.now() }, { merge: true });
console.log(`✓ ${email} es administrador (uid ${user.uid})`);
process.exit(0);
