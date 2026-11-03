import type { L10n, Locale } from '@/lib/schemas';
import { ui, type UIKey } from './ui';

export function t(locale: Locale, key: UIKey, vars?: Record<string, string | number>): string {
  let s: string = ui[locale][key] ?? ui.es[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

/** Texto localizado con caída a español. */
export function loc(value: L10n | undefined | null, locale: Locale): string {
  if (!value) return '';
  return (value[locale] || value.es || '').trim();
}

/** Rutas localizadas. Clave → [es, en] */
const ROUTES = {
  home: ['/', '/en/'],
  shop: ['/tienda', '/en/shop'],
  category: ['/tienda/:slug', '/en/shop/:slug'],
  product: ['/producto/:slug', '/en/product/:slug'],
  about: ['/nosotros', '/en/about'],
  cart: ['/carrito', '/en/cart'],
  shipping: ['/envios', '/en/shipping'],
  terms: ['/terminos', '/en/terms'],
} as const;
export type RouteKey = keyof typeof ROUTES;

export function path(locale: Locale, key: RouteKey, slug?: string): string {
  const tpl = ROUTES[key][locale === 'en' ? 1 : 0];
  return slug ? tpl.replace(':slug', encodeURIComponent(slug)) : tpl;
}

export function formatPrice(value: number, locale: Locale, currency = 'USD'): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-EC', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function plural(locale: Locale, n: number, one: UIKey, other: UIKey) {
  return t(locale, n === 1 ? one : other, { n });
}
