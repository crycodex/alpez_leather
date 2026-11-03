import type { APIRoute } from 'astro';
import { getCategories, getProducts } from '@/lib/server/repo';
import { path, type RouteKey } from '@/i18n';

export const GET: APIRoute = async ({ site, url }) => {
  const base = site ?? new URL(url.origin);
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const entries: { es: string; en: string; lastmod?: number }[] = [];
  (['home', 'shop', 'about', 'shipping', 'terms'] as RouteKey[]).forEach((k) => entries.push({ es: path('es', k), en: path('en', k) }));
  categories.forEach((c) => entries.push({ es: path('es', 'category', c.slug), en: path('en', 'category', c.slug) }));
  products.forEach((p) => entries.push({ es: path('es', 'product', p.slug), en: path('en', 'product', p.slug), lastmod: p.updatedAt }));

  const abs = (p: string) => new URL(p, base).href;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries
  .flatMap((e) =>
    (['es', 'en'] as const).map(
      (l) => `  <url>
    <loc>${abs(e[l])}</loc>${e.lastmod ? `\n    <lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : ''}
    <xhtml:link rel="alternate" hreflang="es" href="${abs(e.es)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${abs(e.en)}"/>
  </url>`,
    ),
  )
  .join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
