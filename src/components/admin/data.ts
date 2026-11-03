/** Acceso a Firestore/Storage desde el panel admin. */
import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit as qLimit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { fb } from '@/lib/firebase/client';
import type { ImageRef, Order, StatsDay } from '@/lib/schemas';

/** Firestore no acepta `undefined`: lo quitamos en profundidad. */
export function clean<T>(v: T): T {
  if (Array.isArray(v)) return v.map(clean) as T;
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) if (val !== undefined) out[k] = clean(val);
    return out as T;
  }
  return v;
}

export async function readDoc<T>(path: string): Promise<T | null> {
  const snap = await getDoc(doc(fb().db, path));
  return snap.exists() ? (snap.data() as T) : null;
}

export async function writeDoc(path: string, data: unknown) {
  await setDoc(doc(fb().db, path), clean(data) as Record<string, unknown>);
}

export async function removeDoc(path: string) {
  await deleteDoc(doc(fb().db, path));
}

export const newId = (col: string) => doc(collection(fb().db, col)).id;

/** Colección en vivo (se actualiza sola). */
export function useCollection<T extends { id: string }>(name: string) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(
    () =>
      onSnapshot(
        collection(fb().db, name),
        (snap) => setItems(snap.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as T)),
        (err) => setError(err.message),
      ),
    [name],
  );
  return { items, error };
}

export function useOrders(max = 200) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  useEffect(
    () =>
      onSnapshot(query(collection(fb().db, 'orders'), orderBy('createdAt', 'desc'), qLimit(max)), (snap) =>
        setOrders(snap.docs.map((d) => ({ ...(d.data() as Order), id: d.id }))),
      ),
    [max],
  );
  return orders;
}

export async function setOrderStatus(id: string, status: Order['status']) {
  await updateDoc(doc(fb().db, 'orders', id), { status });
}

export function ecuadorDate(d = new Date()) {
  return new Date(d.getTime() - 5 * 3600_000).toISOString().slice(0, 10);
}

export function useStats(days: number) {
  const [data, setData] = useState<StatsDay[] | null>(null);
  const load = useCallback(async () => {
    const end = ecuadorDate();
    const start = ecuadorDate(new Date(Date.now() - (days - 1) * 86400_000));
    const snap = await getDocs(
      query(collection(fb().db, 'stats_daily'), where(documentId(), '>=', start), where(documentId(), '<=', end)),
    );
    const byDate = new Map(snap.docs.map((d) => [d.id, { ...(d.data() as StatsDay), date: d.id }]));
    const out: StatsDay[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const key = ecuadorDate(new Date(Date.now() - i * 86400_000));
      out.push(byDate.get(key) ?? { date: key });
    }
    setData(out);
  }, [days]);
  useEffect(() => {
    setData(null);
    load().catch(() => setData([]));
  }, [load]);
  return { data, reload: load };
}

/* ─── Imágenes ─────────────────────────────── */

async function dimensions(file: Blob): Promise<{ width: number; height: number }> {
  const bmp = await createImageBitmap(file);
  const out = { width: bmp.width, height: bmp.height };
  bmp.close();
  return out;
}

/** Comprime a WebP (máx. 2000px) y sube a Storage. */
export async function uploadImage(file: File, folder: string): Promise<ImageRef> {
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 2000,
    maxSizeMB: 1.2,
    fileType: 'image/webp',
    initialQuality: 0.85,
    useWebWorker: true,
  });
  const { width, height } = await dimensions(compressed);
  const safe = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'img';
  const path = `${folder}/${Date.now()}-${safe}.webp`;
  const r = ref(fb().storage, path);
  await uploadBytes(r, compressed, { contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' });
  const url = await getDownloadURL(r);
  return { path, url, width, height, alt: { es: '', en: '' } };
}

export async function deleteImage(img: ImageRef | null | undefined) {
  if (!img?.path) return;
  try {
    await deleteObject(ref(fb().storage, img.path));
  } catch {
    /* ya no existe */
  }
}

/* ─── Publicar (revalidar ISR) ──────────────── */
export async function publish(): Promise<{ ok: boolean; revalidated?: number; note?: string }> {
  const user = fb().auth.currentUser;
  if (!user) throw new Error('Sin sesión');
  const token = await user.getIdToken();
  const res = await fetch('/api/revalidate', { method: 'POST', headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(res.status === 401 ? 'Sin permiso de administrador' : `Error ${res.status}`);
  return res.json();
}

export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
