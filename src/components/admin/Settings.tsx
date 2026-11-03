import { SiteSettings } from '@/lib/schemas';
import { defaultSettings } from '@/data/defaults';
import { DocEditor } from './DocEditor';
import type { FieldSpec } from './FormFields';
import { PageHead } from './ui';

const spec: FieldSpec[] = [
  { type: 'heading', label: 'Contacto y pedidos' },
  { key: 'whatsapp', type: 'text', label: 'WhatsApp para pedidos', placeholder: '593962227312', help: 'Solo números, con código de país (593) y sin el 0 inicial. Aquí llegan todos los pedidos del carrito.' },
  { key: 'whatsappGreeting', type: 'l10n', label: 'Saludo del mensaje de pedido', help: 'Primera línea del mensaje que el cliente envía.' },
  { key: 'email', type: 'text', label: 'Correo de contacto (opcional)' },
  { key: 'address', type: 'l10n', label: 'Dirección' },
  { key: 'hours', type: 'l10n-area', label: 'Horario de atención (opcional)', rows: 2 },
  { key: 'shippingNote', type: 'l10n-area', label: 'Nota de envío (en cada producto)', rows: 2 },
  { type: 'heading', label: 'Redes sociales' },
  { key: 'instagram', type: 'text', label: 'Usuario de Instagram', placeholder: 'alpez_leather', help: 'Sin @.' },
  { key: 'facebook', type: 'text', label: 'Facebook (enlace completo, opcional)' },
  { key: 'tiktok', type: 'text', label: 'TikTok (enlace completo, opcional)' },
  { type: 'heading', label: 'Buscadores y redes (SEO)', help: 'Cómo aparece el sitio en Google y al compartir el enlace.' },
  { key: 'brandName', type: 'text', label: 'Nombre de la marca' },
  { key: 'seoTitle', type: 'l10n', label: 'Título para Google' },
  { key: 'seoDescription', type: 'l10n-area', label: 'Descripción para Google', rows: 2, help: 'Ideal: 140–160 caracteres.' },
  { key: 'ogImage', type: 'image', label: 'Imagen al compartir (1200×630)', folder: 'content/seo', help: 'Si no subes una, se usa el logo.' },
];

export default function Settings() {
  return (
    <>
      <PageHead title="Ajustes" description="Datos de contacto, redes y SEO." />
      <DocEditor path="settings/site" schema={SiteSettings} defaults={defaultSettings} spec={spec} />
    </>
  );
}
