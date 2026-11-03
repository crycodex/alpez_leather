import { getAdminAuth, getDb } from './firebase-admin';

/** Verifica el ID token de Firebase y que el usuario esté en la colección `admins`. */
export async function requireAdmin(request: Request): Promise<{ uid: string } | null> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const auth = getAdminAuth();
  const db = getDb();
  if (!token || !auth || !db) return null;
  try {
    const decoded = await auth.verifyIdToken(token);
    if (decoded.admin === true) return { uid: decoded.uid };
    const snap = await db.collection('admins').doc(decoded.uid).get();
    return snap.exists ? { uid: decoded.uid } : null;
  } catch {
    return null;
  }
}
