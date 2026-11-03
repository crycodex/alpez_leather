import type { Locale, Order } from './schemas';
import { formatPrice, t } from '@/i18n';

export const waLink = (phone: string, text?: string) =>
  `https://wa.me/${phone.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** Mensaje de pedido que llega al WhatsApp de Alpez. Texto plano, legible en el celular. */
export function orderMessage(order: Order, greeting: string, currency = 'USD'): string {
  const L: Locale = order.locale;
  const money = (n: number) => formatPrice(n, L, currency);
  const lines = order.lines.map((line, i) => {
    const price = line.unitPrice > 0 ? money(line.lineTotal) : t(L, 'wa.tbd');
    const variants = line.variants ? ` (${line.variants})` : '';
    return `${i + 1}. ${line.name}${variants} × ${line.qty} — ${price}`;
  });
  const total = !order.hasUnpricedItems
    ? money(order.total)
    : order.total > 0
      ? `${money(order.total)} + ${t(L, 'wa.tbd')}`
      : t(L, 'wa.tbd');
  const out = [
    greeting,
    '',
    ...lines,
    '',
    `*${t(L, 'wa.total')}: ${total}*`,
    '',
    `${t(L, 'wa.name')}: ${order.customer.name}`,
  ];
  if (order.customer.city) out.push(`${t(L, 'wa.city')}: ${order.customer.city}`);
  if (order.customer.note) out.push(`${t(L, 'wa.note')}: ${order.customer.note}`);
  out.push('', `${t(L, 'wa.order')} #${order.code}`);
  return out.join('\n');
}
