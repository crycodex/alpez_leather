import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site, url }) => {
  const base = site ?? new URL(url.origin);
  return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /carrito\nDisallow: /en/cart\n\nSitemap: ${new URL('/sitemap.xml', base).href}\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};
