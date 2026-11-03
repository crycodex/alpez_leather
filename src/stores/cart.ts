/**
 * Carrito persistente en localStorage, compartido por todas las islas/scripts.
 * Guarda una "foto" del producto para mostrarlo sin red; el servidor recalcula
 * precios reales al hacer checkout.
 */
import { persistentAtom } from '@nanostores/persistent';
import { computed } from 'nanostores';
import type { L10n } from '@/lib/schemas';

export interface CartItem {
  key: string;
  productId: string;
  slug: string;
  name: L10n;
  image: string;
  /** variantId → optionId */
  selections: Record<string, string>;
  /** Etiquetas legibles, p. ej. [{ name: Color, value: Miel }] */
  labels: { name: L10n; value: L10n }[];
  unitPrice: number;
  qty: number;
}

export const cart = persistentAtom<CartItem[]>('alpez-cart-v1', [], {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  },
});

export const cartCount = computed(cart, (items) => items.reduce((n, i) => n + i.qty, 0));
export const cartTotal = computed(cart, (items) => items.reduce((n, i) => n + i.unitPrice * i.qty, 0));
export const cartHasUnpriced = computed(cart, (items) => items.some((i) => i.unitPrice <= 0));

export const itemKey = (productId: string, selections: Record<string, string>) =>
  [productId, ...Object.entries(selections).sort().map(([k, v]) => `${k}:${v}`)].join('|');

export function addToCart(item: Omit<CartItem, 'key' | 'qty'>, qty = 1) {
  const key = itemKey(item.productId, item.selections);
  const items = cart.get();
  const existing = items.find((i) => i.key === key);
  cart.set(
    existing
      ? items.map((i) => (i.key === key ? { ...i, qty: Math.min(99, i.qty + qty) } : i))
      : [...items, { ...item, key, qty }],
  );
}

export function setQty(key: string, qty: number) {
  cart.set(qty <= 0 ? cart.get().filter((i) => i.key !== key) : cart.get().map((i) => (i.key === key ? { ...i, qty: Math.min(99, qty) } : i)));
}

export const removeItem = (key: string) => setQty(key, 0);
export const clearCart = () => cart.set([]);
