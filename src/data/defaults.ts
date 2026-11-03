/**
 * Contenido por defecto.
 * - Se usa cuando Firebase aún no está configurado (modo demo local).
 * - `npm run seed` lo copia a Firestore como punto de partida.
 * Todo lo que no es un hecho confirmado va marcado `pending: true` y se
 * reemplaza desde el panel admin. No se inventan precios ni historias.
 */
import type {
  AboutContent,
  Category,
  FaqContent,
  HomeContent,
  LegalContent,
  Product,
  SiteSettings,
} from '@/lib/schemas';

const l = (es: string, en: string) => ({ es, en });

export const defaultSettings: SiteSettings = {
  brandName: 'Alpez Leather',
  whatsapp: '593962227312',
  instagram: 'alpez_leather',
  facebook: '',
  tiktok: '',
  email: '',
  address: l('Cotacachi, Imbabura, Ecuador', 'Cotacachi, Imbabura, Ecuador'),
  hours: l('', ''),
  currency: 'USD',
  shippingNote: l(
    'Coordinamos el envío por WhatsApp al confirmar tu pedido.',
    'We arrange shipping over WhatsApp once your order is confirmed.',
  ),
  whatsappGreeting: l(
    'Hola Alpez Leather, quiero hacer este pedido:',
    'Hi Alpez Leather, I would like to place this order:',
  ),
  seoTitle: l(
    'Alpez Leather — Artículos de cuero hechos en Cotacachi',
    'Alpez Leather — Leather goods made in Cotacachi',
  ),
  seoDescription: l(
    'Carteras, bolsos, manillas y correas de cuero de alta calidad. Fabricantes directos en Cotacachi, Ecuador. Haz tu pedido por WhatsApp.',
    'High-quality leather handbags, bags, bracelets and belts. Direct makers in Cotacachi, Ecuador. Order on WhatsApp.',
  ),
  ogImage: null,
};

export const defaultHome: HomeContent = {
  heroTagline: l('Hecho a mano en Cotacachi, Ecuador', 'Handmade in Cotacachi, Ecuador'),
  heroLead: l(
    'Diseños en cuero de alta calidad. Somos fabricantes directos: del taller a tus manos.',
    'High-quality leather designs. We are direct makers: from our workshop to your hands.',
  ),
  heroProductId: '',
  heroImage: null,
  categoriesTitle: l('Colección', 'Collection'),
  featuredTitle: l('Piezas destacadas', 'Featured pieces'),
  craft: {
    title: l('Del cuero a la pieza', 'From hide to piece'),
    body: l(
      'Cada artículo se corta, se cose y se termina en nuestro taller de Cotacachi.',
      'Every piece is cut, stitched and finished in our Cotacachi workshop.',
    ),
    pending: true,
    image: null,
    steps: [
      { title: l('Selección', 'Selection'), body: l('Pendiente: cómo eligen el cuero.', 'Pending: how the leather is chosen.') },
      { title: l('Corte', 'Cutting'), body: l('Pendiente: el corte y los moldes.', 'Pending: cutting and patterns.') },
      { title: l('Costura', 'Stitching'), body: l('Pendiente: la costura y el armado.', 'Pending: stitching and assembly.') },
      { title: l('Acabado', 'Finishing'), body: l('Pendiente: bordes, tinte y revisión final.', 'Pending: edges, dye and final check.') },
    ],
  },
  direct: {
    title: l('Fabricantes directos', 'Direct makers'),
    body: l(
      'Sin intermediarios: diseñamos y fabricamos cada pieza, y te atendemos nosotros mismos por WhatsApp.',
      'No middlemen: we design and make every piece, and we answer you ourselves on WhatsApp.',
    ),
    pending: false,
  },
  instagram: {
    title: l('Síguenos en Instagram', 'Follow us on Instagram'),
    body: l(
      'Nuevos diseños, procesos del taller y piezas disponibles.',
      'New designs, workshop processes and available pieces.',
    ),
    pending: false,
  },
  closing: {
    title: l('¿Te gustó una pieza?', 'Found a piece you like?'),
    body: l(
      'Arma tu pedido y envíalo por WhatsApp. Te respondemos con disponibilidad y envío.',
      'Build your order and send it on WhatsApp. We reply with availability and shipping.',
    ),
    pending: false,
  },
};

export const defaultAbout: AboutContent = {
  title: l('Nosotros', 'About us'),
  lead: l(
    'Somos Alpez Leather, fabricantes de artículos de cuero en Cotacachi, Ecuador.',
    'We are Alpez Leather, leather goods makers in Cotacachi, Ecuador.',
  ),
  story: {
    title: l('Nuestra historia', 'Our story'),
    body: l(
      'Contenido pendiente. Aquí va la historia de la marca: quién la fundó, desde cuándo trabajan el cuero y qué los distingue.',
      'Pending content. The brand story goes here: who founded it, how long they have worked leather and what sets them apart.',
    ),
    pending: true,
  },
  image: null,
  gallery: [],
  values: [
    { title: l('Calidad', 'Quality'), body: l('Cuero de alta calidad en cada diseño.', 'High-quality leather in every design.') },
    { title: l('Directo', 'Direct'), body: l('Fabricamos nosotros mismos, sin intermediarios.', 'We make everything ourselves, with no middlemen.') },
    { title: l('Origen', 'Origin'), body: l('Hecho en Cotacachi, tierra del cuero en Ecuador.', 'Made in Cotacachi, Ecuador’s leather town.') },
  ],
  origin: {
    title: l('Cotacachi', 'Cotacachi'),
    body: l(
      'Contenido pendiente. Unas líneas sobre Cotacachi, el taller y la comunidad de artesanos.',
      'Pending content. A few lines about Cotacachi, the workshop and the artisan community.',
    ),
    pending: true,
  },
};

export const defaultFaq: FaqContent = {
  title: l('Preguntas frecuentes', 'Frequently asked questions'),
  pending: true,
  items: [
    {
      q: l('¿Cómo hago un pedido?', 'How do I order?'),
      a: l(
        'Agrega las piezas al carrito y presiona «Pedir por WhatsApp». Se abrirá un mensaje con tu pedido listo para enviar.',
        'Add pieces to your cart and press “Order on WhatsApp”. A message with your order will open, ready to send.',
      ),
    },
    {
      q: l('¿Hacen envíos?', 'Do you ship?'),
      a: l('Pendiente: zonas, tiempos y costos de envío.', 'Pending: shipping areas, times and costs.'),
    },
    {
      q: l('¿Qué formas de pago aceptan?', 'Which payment methods do you accept?'),
      a: l('Pendiente: formas de pago.', 'Pending: payment methods.'),
    },
    {
      q: l('¿Puedo pedir una pieza personalizada?', 'Can I request a custom piece?'),
      a: l('Pendiente: condiciones de personalización.', 'Pending: customization terms.'),
    },
  ],
};

export const defaultLegal: LegalContent = {
  shipping: {
    title: l('Envíos y devoluciones', 'Shipping & returns'),
    body: l(
      'Contenido pendiente: políticas de envío, tiempos de entrega, cambios y devoluciones.',
      'Pending content: shipping policy, delivery times, exchanges and returns.',
    ),
    pending: true,
  },
  terms: {
    title: l('Términos y condiciones', 'Terms & conditions'),
    body: l('Contenido pendiente: términos y condiciones de venta.', 'Pending content: terms and conditions of sale.'),
    pending: true,
  },
};

export const defaultCategories: Category[] = [
  { id: 'carteras', slug: 'carteras', name: l('Carteras', 'Handbags'), description: l('', ''), image: null, order: 1, active: true, pending: false },
  { id: 'bolsos', slug: 'bolsos', name: l('Bolsos', 'Bags'), description: l('', ''), image: null, order: 2, active: true, pending: false },
  { id: 'manillas', slug: 'manillas', name: l('Manillas', 'Bracelets'), description: l('', ''), image: null, order: 3, active: true, pending: false },
  { id: 'correas', slug: 'correas', name: l('Correas', 'Belts'), description: l('', ''), image: null, order: 4, active: true, pending: false },
  { id: 'accesorios', slug: 'accesorios', name: l('Accesorios', 'Accessories'), description: l('', ''), image: null, order: 5, active: true, pending: true },
];

/** Productos de ejemplo: sin foto y sin precio hasta que el dueño los complete. */
const sample = (
  id: string,
  categoryId: string,
  es: string,
  en: string,
  order: number,
  featured = false,
  variants: Product['variants'] = [],
): Product => ({
  id,
  slug: id,
  categoryId,
  name: l(es, en),
  description: l(
    'Descripción pendiente. Cuenta el estilo, el uso y lo que hace especial a esta pieza.',
    'Description pending. Describe the style, the use and what makes this piece special.',
  ),
  details: l('Material: cuero\nMedidas: pendiente\nCuidados: pendiente', 'Material: leather\nSize: pending\nCare: pending'),
  price: 0,
  compareAtPrice: null,
  images: [],
  variants,
  featured,
  active: true,
  stockStatus: 'available',
  order,
  pending: true,
});

const colorVariant: Product['variants'] = [
  {
    id: 'color',
    name: l('Color', 'Color'),
    options: [
      { id: 'miel', label: l('Miel', 'Honey'), priceDelta: 0, available: true },
      { id: 'chocolate', label: l('Chocolate', 'Chocolate'), priceDelta: 0, available: true },
      { id: 'negro', label: l('Negro', 'Black'), priceDelta: 0, available: true },
    ],
  },
];
const sizeVariant: Product['variants'] = [
  {
    id: 'talla',
    name: l('Talla', 'Size'),
    options: ['S', 'M', 'L', 'XL'].map((s) => ({ id: s.toLowerCase(), label: l(s, s), priceDelta: 0, available: true })),
  },
];

export const defaultProducts: Product[] = [
  sample('cartera-ejemplo-1', 'carteras', 'Cartera (ejemplo)', 'Handbag (sample)', 1, true, colorVariant),
  sample('cartera-ejemplo-2', 'carteras', 'Cartera de mano (ejemplo)', 'Clutch (sample)', 2, false, colorVariant),
  sample('bolso-ejemplo-1', 'bolsos', 'Bolso (ejemplo)', 'Bag (sample)', 3, true, colorVariant),
  sample('manilla-ejemplo-1', 'manillas', 'Manilla (ejemplo)', 'Bracelet (sample)', 4, true),
  sample('correa-ejemplo-1', 'correas', 'Correa (ejemplo)', 'Belt (sample)', 5, true, sizeVariant),
  sample('correa-ejemplo-2', 'correas', 'Correa clásica (ejemplo)', 'Classic belt (sample)', 6, false, sizeVariant),
];
