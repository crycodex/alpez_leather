/**
 * Modelo de datos de Alpez Leather.
 * Compartido por el sitio público (servidor), las rutas API y el panel admin,
 * para que la validación sea idéntica en todos lados.
 */
import { z } from 'zod';

export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** Texto bilingüe. `en` puede quedar vacío: el sitio cae a `es`. */
export const L10n = z.object({
  es: z.string().default(''),
  en: z.string().default(''),
});
export type L10n = z.infer<typeof L10n>;

export const ImageRef = z.object({
  /** Ruta en Firebase Storage (para borrar) */
  path: z.string().default(''),
  url: z.string().default(''),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  alt: L10n.optional(),
});
export type ImageRef = z.infer<typeof ImageRef>;

export const VariantOption = z.object({
  id: z.string(),
  label: L10n,
  /** Diferencia de precio en USD respecto al precio base (puede ser 0) */
  priceDelta: z.number().default(0),
  available: z.boolean().default(true),
});
export const Variant = z.object({
  id: z.string(),
  name: L10n,
  options: z.array(VariantOption).default([]),
});
export type Variant = z.infer<typeof Variant>;
export type VariantOption = z.infer<typeof VariantOption>;

export const STOCK_STATUS = ['available', 'made_to_order', 'sold_out'] as const;

export const Category = z.object({
  id: z.string(),
  slug: z.string().min(1),
  name: L10n,
  description: L10n.default({ es: '', en: '' }),
  image: ImageRef.nullable().default(null),
  order: z.number().default(0),
  active: z.boolean().default(true),
  pending: z.boolean().default(false),
});
export type Category = z.infer<typeof Category>;

export const Product = z.object({
  id: z.string(),
  slug: z.string().min(1),
  categoryId: z.string().default(''),
  name: L10n,
  description: L10n.default({ es: '', en: '' }),
  /** Materiales, medidas, cuidados. Una línea por dato. */
  details: L10n.default({ es: '', en: '' }),
  /** USD. 0 = "precio por confirmar" */
  price: z.number().min(0).default(0),
  compareAtPrice: z.number().min(0).nullable().default(null),
  images: z.array(ImageRef).default([]),
  variants: z.array(Variant).default([]),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  stockStatus: z.enum(STOCK_STATUS).default('available'),
  order: z.number().default(0),
  pending: z.boolean().default(false),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});
export type Product = z.infer<typeof Product>;

export const SiteSettings = z.object({
  brandName: z.string().default('Alpez Leather'),
  /** Solo dígitos con código de país, p. ej. 593962227312 */
  whatsapp: z.string().default('593962227312'),
  instagram: z.string().default('alpez_leather'),
  facebook: z.string().default(''),
  tiktok: z.string().default(''),
  email: z.string().default(''),
  address: L10n.default({ es: '', en: '' }),
  hours: L10n.default({ es: '', en: '' }),
  currency: z.string().default('USD'),
  shippingNote: L10n.default({ es: '', en: '' }),
  whatsappGreeting: L10n.default({ es: '', en: '' }),
  seoTitle: L10n.default({ es: '', en: '' }),
  seoDescription: L10n.default({ es: '', en: '' }),
  ogImage: ImageRef.nullable().default(null),
});
export type SiteSettings = z.infer<typeof SiteSettings>;

const Block = z.object({ title: L10n, body: L10n, pending: z.boolean().default(false) });

export const HomeContent = z.object({
  heroTagline: L10n,
  heroLead: L10n,
  heroProductId: z.string().default(''),
  heroImage: ImageRef.nullable().default(null),
  categoriesTitle: L10n,
  featuredTitle: L10n,
  craft: Block.extend({
    image: ImageRef.nullable().default(null),
    steps: z
      .array(z.object({ title: L10n, body: L10n }))
      .default([]),
  }),
  direct: Block,
  instagram: Block,
  closing: Block,
});
export type HomeContent = z.infer<typeof HomeContent>;

export const AboutContent = z.object({
  title: L10n,
  lead: L10n,
  story: Block,
  image: ImageRef.nullable().default(null),
  gallery: z.array(ImageRef).default([]),
  values: z.array(z.object({ title: L10n, body: L10n })).default([]),
  origin: Block,
});
export type AboutContent = z.infer<typeof AboutContent>;

export const FaqContent = z.object({
  title: L10n,
  items: z.array(z.object({ q: L10n, a: L10n })).default([]),
  pending: z.boolean().default(false),
});
export type FaqContent = z.infer<typeof FaqContent>;

export const LegalContent = z.object({
  shipping: Block,
  terms: Block,
});
export type LegalContent = z.infer<typeof LegalContent>;

/* ─── Pedidos y estadísticas ─────────────────────────── */

export const CheckoutItem = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(99),
  /** variantId → optionId */
  selections: z.record(z.string(), z.string()).default({}),
});
export const CheckoutRequest = z.object({
  items: z.array(CheckoutItem).min(1).max(50),
  customer: z.object({
    name: z.string().trim().min(1).max(80),
    city: z.string().trim().max(80).default(''),
    note: z.string().trim().max(500).default(''),
  }),
  locale: z.enum(LOCALES).default('es'),
});
export type CheckoutRequest = z.infer<typeof CheckoutRequest>;

export const ORDER_STATUS = ['pending', 'confirmed', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

export interface OrderLine {
  productId: string;
  name: string;
  variants: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
}
export interface Order {
  id: string;
  code: string;
  lines: OrderLine[];
  total: number;
  hasUnpricedItems: boolean;
  customer: { name: string; city: string; note: string };
  locale: Locale;
  status: OrderStatus;
  createdAt: number;
}

export const TRACK_EVENTS = ['page_view', 'product_view', 'add_to_cart'] as const;
export const TrackRequest = z.object({
  type: z.enum(TRACK_EVENTS),
  productId: z.string().max(64).optional(),
  path: z.string().max(200).optional(),
  locale: z.enum(LOCALES).optional(),
});

export interface StatsDay {
  date: string;
  pageViews?: number;
  productViews?: number;
  addToCart?: number;
  checkouts?: number;
  revenue?: number;
  views?: Record<string, number>;
  carts?: Record<string, number>;
  ordered?: Record<string, number>;
  locales?: Record<string, number>;
}
