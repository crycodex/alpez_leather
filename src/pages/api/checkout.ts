/**
 * Recibe el carrito, recalcula precios con los datos reales del catálogo,
 * guarda el pedido (para el panel) y devuelve el enlace de WhatsApp.
 */
import type { APIRoute } from 'astro';
import { FieldValue } from 'firebase-admin/firestore';
import { getDb } from '@/lib/server/firebase-admin';
import { getAllProducts, getSettings } from '@/lib/server/repo';
import { clientIp, ecuadorDate, json, rateLimited, sameOrigin } from '@/lib/server/http';
import { CheckoutRequest, type Order, type OrderLine } from '@/lib/schemas';
import { loc } from '@/i18n';
import { orderMessage, waLink } from '@/lib/whatsapp';

export const prerender = false;

const code = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => alphabet[b % alphabet.length]).join('');
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  if (rateLimited(`c:${clientIp(request, clientAddress)}`, 10, 60_000)) return json({ error: 'too_many_requests' }, 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const parsed = CheckoutRequest.safeParse(body);
  if (!parsed.success) return json({ error: 'invalid_request', issues: parsed.error.issues.slice(0, 5) }, 400);

  const { items, customer, locale } = parsed.data;
  const [products, settings] = await Promise.all([getAllProducts(), getSettings()]);
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: OrderLine[] = [];
  let hasUnpricedItems = false;
  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p || !p.active) continue;
    const chosen = p.variants
      .map((v) => {
        const opt = v.options.find((o) => o.id === item.selections[v.id]);
        return opt ? { v, opt } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    const unitPrice = p.price > 0 ? p.price + chosen.reduce((n, c) => n + c.opt.priceDelta, 0) : 0;
    if (unitPrice <= 0) hasUnpricedItems = true;
    lines.push({
      productId: p.id,
      name: loc(p.name, locale),
      variants: chosen.map((c) => `${loc(c.v.name, locale)}: ${loc(c.opt.label, locale)}`).join(', '),
      unitPrice,
      qty: item.qty,
      lineTotal: Math.round(unitPrice * item.qty * 100) / 100,
    });
  }
  if (!lines.length) return json({ error: 'empty_cart' }, 400);

  const order: Order = {
    id: '',
    code: code(),
    lines,
    total: Math.round(lines.reduce((n, l) => n + l.lineTotal, 0) * 100) / 100,
    hasUnpricedItems,
    customer: { name: customer.name, city: customer.city, note: customer.note },
    locale,
    status: 'pending',
    createdAt: Date.now(),
  };

  const db = getDb();
  if (db) {
    try {
      const ref = db.collection('orders').doc();
      order.id = ref.id;
      const stats = db.collection('stats_daily').doc(ecuadorDate());
      const statUpdate: Record<string, unknown> = {
        checkouts: FieldValue.increment(1),
        revenue: FieldValue.increment(order.total),
      };
      for (const l of lines) statUpdate[`ordered.${l.productId}`] = FieldValue.increment(l.qty);
      await ref.set(order);
      await stats.set({ date: ecuadorDate() }, { merge: true });
      await stats.update(statUpdate);
    } catch (err) {
      // El pedido igual se envía por WhatsApp aunque falle el registro.
      console.error('[checkout] no se pudo guardar el pedido', err);
    }
  }

  const greeting = loc(settings.whatsappGreeting, locale) || 'Hola Alpez Leather';
  return json({ orderId: order.id, code: order.code, whatsappUrl: waLink(settings.whatsapp, orderMessage(order, greeting, settings.currency)) });
};
