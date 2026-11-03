/**
 * "Publicar cambios" desde el admin: invalida la caché ISR de Vercel
 * para que el sitio muestre lo último de Firestore inmediatamente.
 */
import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/server/auth';
import { clearRepoCache, getAllProducts, getCategories } from '@/lib/server/repo';
import { json } from '@/lib/server/http';
import { path, type RouteKey } from '@/i18n';
import { LOCALES } from '@/lib/schemas';

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  const admin = await requireAdmin(request);
  if (!admin) return json({ error: 'unauthorized' }, 401);

  clearRepoCache();
  const token = import.meta.env.VERCEL_REVALIDATE_TOKEN || process.env.VERCEL_REVALIDATE_TOKEN;
  if (!token) return json({ ok: true, revalidated: 0, note: 'ISR desactivado (sin VERCEL_REVALIDATE_TOKEN): los cambios ya son visibles.' });

  const [categories, products] = await Promise.all([getCategories(), getAllProducts()]);
  const statics: RouteKey[] = ['home', 'shop', 'about', 'shipping', 'terms', 'cart'];
  const paths = new Set<string>();
  for (const l of LOCALES) {
    statics.forEach((k) => paths.add(path(l, k)));
    categories.forEach((c) => paths.add(path(l, 'category', c.slug)));
    products.forEach((p) => paths.add(path(l, 'product', p.slug)));
  }
  paths.add('/sitemap.xml');

  const results = await Promise.allSettled(
    [...paths].map((p) => fetch(new URL(p, url.origin), { method: 'HEAD', headers: { 'x-prerender-revalidate': token } })),
  );
  const failed = results.filter((r) => r.status === 'rejected' || !r.value.ok).length;
  return json({ ok: failed === 0, revalidated: paths.size - failed, failed });
};
