import type { APIRoute } from 'astro';
import { FieldValue } from 'firebase-admin/firestore';
import { getDb } from '@/lib/server/firebase-admin';
import { clientIp, ecuadorDate, rateLimited, sameOrigin } from '@/lib/server/http';
import { TrackRequest } from '@/lib/schemas';

export const prerender = false;

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse/i;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!sameOrigin(request) || BOT.test(request.headers.get('user-agent') || '')) return new Response(null, { status: 204 });
  if (rateLimited(`t:${clientIp(request, clientAddress)}`, 120, 60_000)) return new Response(null, { status: 429 });

  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const parsed = TrackRequest.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 400 });

  const db = getDb();
  if (!db) return new Response(null, { status: 204 });

  const { type, productId, locale } = parsed.data;
  const pid = productId?.replace(/[^\w-]/g, '');
  const inc = FieldValue.increment(1);
  const update: Record<string, unknown> = { date: ecuadorDate() };
  if (type === 'page_view') {
    update.pageViews = inc;
    if (locale) update[`locales.${locale}`] = inc;
  } else if (type === 'product_view' && pid) {
    update.productViews = inc;
    update[`views.${pid}`] = inc;
  } else if (type === 'add_to_cart' && pid) {
    update.addToCart = inc;
    update[`carts.${pid}`] = inc;
  } else {
    return new Response(null, { status: 204 });
  }

  try {
    const ref = db.collection('stats_daily').doc(ecuadorDate());
    // update() entiende rutas con punto ("views.abc"); set+merge no, por eso este orden.
    await ref.update(update).catch(async (err: { code?: number }) => {
      if (err?.code !== 5) throw err; // 5 = NOT_FOUND
      await ref.set({ date: ecuadorDate() }, { merge: true });
      await ref.update(update);
    });
  } catch (err) {
    console.error('[track]', err);
  }
  return new Response(null, { status: 204 });
};
