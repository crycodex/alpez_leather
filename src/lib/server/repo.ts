/**
 * Lectura de datos para el sitio público.
 * Firestore → validado con zod → mezclado sobre los valores por defecto.
 * Cache en memoria corto por instancia; el CDN (ISR) hace el resto.
 */
import { getDb } from './firebase-admin';
import {
  AboutContent,
  Category,
  FaqContent,
  HomeContent,
  LegalContent,
  Product,
  SiteSettings,
} from '@/lib/schemas';
import {
  defaultAbout,
  defaultCategories,
  defaultFaq,
  defaultHome,
  defaultLegal,
  defaultProducts,
  defaultSettings,
} from '@/data/defaults';
import type { z } from 'zod';

const TTL = 30_000;
const cache = new Map<string, { at: number; value: unknown }>();

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

export function clearRepoCache() {
  cache.clear();
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Mezcla profunda: lo guardado gana; lo que falte viene del default. */
function deepMerge<T>(base: T, over: unknown): T {
  if (!isObj(base) || !isObj(over)) return (over === undefined || over === null ? base : over) as T;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = isObj(b) && isObj(v) ? deepMerge(b, v) : v === undefined ? b : v;
  }
  return out as T;
}

async function readDoc<S extends z.ZodType>(path: string, schema: S, fallback: z.infer<S>): Promise<z.infer<S>> {
  const db = getDb();
  if (!db) return fallback;
  try {
    const snap = await db.doc(path).get();
    if (!snap.exists) return fallback;
    const parsed = schema.safeParse(deepMerge(fallback, snap.data()));
    if (!parsed.success) {
      console.warn(`[repo] ${path} inválido, usando default`, parsed.error.issues.slice(0, 3));
      return fallback;
    }
    return parsed.data;
  } catch (err) {
    console.error(`[repo] error leyendo ${path}`, err);
    return fallback;
  }
}

async function readCollection<S extends z.ZodType>(name: string, schema: S, fallback: z.infer<S>[]): Promise<z.infer<S>[]> {
  const db = getDb();
  if (!db) return fallback;
  try {
    const snap = await db.collection(name).get();
    const out: z.infer<S>[] = [];
    for (const d of snap.docs) {
      const parsed = schema.safeParse({ ...d.data(), id: d.id });
      if (parsed.success) out.push(parsed.data);
      else console.warn(`[repo] ${name}/${d.id} inválido`, parsed.error.issues.slice(0, 3));
    }
    return out;
  } catch (err) {
    console.error(`[repo] error leyendo ${name}`, err);
    return fallback;
  }
}

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

export const getSettings = () => cached('settings', () => readDoc('settings/site', SiteSettings, defaultSettings));
export const getHome = () => cached('home', () => readDoc('content/home', HomeContent, defaultHome));
export const getAbout = () => cached('about', () => readDoc('content/about', AboutContent, defaultAbout));
export const getFaq = () => cached('faq', () => readDoc('content/faq', FaqContent, defaultFaq));
export const getLegal = () => cached('legal', () => readDoc('content/legal', LegalContent, defaultLegal));

export const getAllCategories = () =>
  cached('categories', async () => (await readCollection('categories', Category, defaultCategories)).sort(byOrder));
export const getCategories = async () => (await getAllCategories()).filter((c) => c.active);

export const getAllProducts = () =>
  cached('products', async () => (await readCollection('products', Product, defaultProducts)).sort(byOrder));

export async function getProducts(opts: { categoryId?: string } = {}) {
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);
  const activeCats = new Set(categories.map((c) => c.id));
  return products.filter(
    (p) => p.active && (!p.categoryId || activeCats.has(p.categoryId)) && (!opts.categoryId || p.categoryId === opts.categoryId),
  );
}

export async function getFeatured(limit = 8) {
  const products = await getProducts();
  const featured = products.filter((p) => p.featured);
  return (featured.length ? featured : products).slice(0, limit);
}

export async function getProductBySlug(slug: string) {
  return (await getProducts()).find((p) => p.slug === slug) ?? null;
}

export async function getCategoryBySlug(slug: string) {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
}

export async function getProductById(id: string) {
  return (await getAllProducts()).find((p) => p.id === id) ?? null;
}
