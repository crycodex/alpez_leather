import { AboutContent, FaqContent, HomeContent, LegalContent } from '@/lib/schemas';
import { defaultAbout, defaultFaq, defaultHome, defaultLegal } from '@/data/defaults';
import { DocEditor } from './DocEditor';
import type { FieldSpec } from './FormFields';
import { PageHead } from './ui';
import { go } from './AdminApp';

const l = () => ({ es: '', en: '' });
const pending: FieldSpec = { key: 'pending', type: 'bool', label: 'Marcar como pendiente', help: 'Muestra la etiqueta «Pendiente» en el sitio.' };
const block = (prefix: string, label: string, rows = 3): FieldSpec[] => [
  { type: 'heading', label },
  { key: `${prefix}.title`, type: 'l10n', label: 'Título' },
  { key: `${prefix}.body`, type: 'l10n-area', label: 'Texto', rows },
  { ...(pending as Extract<FieldSpec, { key: string }>), key: `${prefix}.pending` } as FieldSpec,
];

const homeSpec: FieldSpec[] = [
  { type: 'heading', label: 'Portada (hero)', help: 'Lo primero que se ve. El sello «ALPEZ» es fijo; esto lo acompaña.' },
  { key: 'heroTagline', type: 'l10n', label: 'Frase corta' },
  { key: 'heroLead', type: 'l10n-area', label: 'Texto principal', rows: 2 },
  { key: 'heroProductId', type: 'product', label: 'Pieza destacada en portada', help: 'Su foto y precio aparecen junto al sello.' },
  { key: 'heroImage', type: 'image', label: 'Foto alternativa de portada (opcional)', folder: 'content/home', help: 'Si la subes, reemplaza la foto de la pieza destacada.' },
  { type: 'heading', label: 'Títulos de secciones' },
  { key: 'categoriesTitle', type: 'l10n', label: 'Título de categorías' },
  { key: 'featuredTitle', type: 'l10n', label: 'Título de destacados' },
  ...block('direct', 'Fabricantes directos'),
  ...block('craft', 'El oficio (proceso)'),
  { key: 'craft.image', type: 'image', label: 'Foto del taller', folder: 'content/home' },
  { key: 'craft.steps', type: 'list', label: 'Pasos del proceso', itemLabel: 'Paso', blank: () => ({ title: l(), body: l() }), fields: [{ key: 'title', type: 'l10n', label: 'Título' }, { key: 'body', type: 'l10n-area', label: 'Texto', rows: 2 }] },
  ...block('instagram', 'Bloque de Instagram', 2),
  ...block('closing', 'Cierre (llamado final)', 2),
];

const aboutSpec: FieldSpec[] = [
  { key: 'title', type: 'l10n', label: 'Título de la página' },
  { key: 'lead', type: 'l10n-area', label: 'Frase de presentación', rows: 2 },
  { key: 'image', type: 'image', label: 'Foto principal (horizontal)', folder: 'content/about' },
  ...block('story', 'Nuestra historia', 8),
  { type: 'heading', label: 'Valores' },
  { key: 'values', type: 'list', label: 'Valores', itemLabel: 'Valor', blank: () => ({ title: l(), body: l() }), fields: [{ key: 'title', type: 'l10n', label: 'Título' }, { key: 'body', type: 'l10n-area', label: 'Texto', rows: 2 }] },
  ...block('origin', 'Cotacachi / el taller', 5),
  { key: 'gallery', type: 'images', label: 'Fotos del taller (hasta 4)', folder: 'content/about' },
];

const faqSpec: FieldSpec[] = [
  { key: 'title', type: 'l10n', label: 'Título' },
  pending,
  { key: 'items', type: 'list', label: 'Preguntas', itemLabel: 'Pregunta', blank: () => ({ q: l(), a: l() }), fields: [{ key: 'q', type: 'l10n', label: 'Pregunta' }, { key: 'a', type: 'l10n-area', label: 'Respuesta', rows: 3 }] },
];

const legalSpec: FieldSpec[] = [...block('shipping', 'Envíos y devoluciones', 10), ...block('terms', 'Términos y condiciones', 10)];

const TABS = [
  { id: 'inicio', label: 'Inicio', path: 'content/home', schema: HomeContent, defaults: defaultHome, spec: homeSpec },
  { id: 'nosotros', label: 'Nosotros', path: 'content/about', schema: AboutContent, defaults: defaultAbout, spec: aboutSpec },
  { id: 'faq', label: 'Preguntas frecuentes', path: 'content/faq', schema: FaqContent, defaults: defaultFaq, spec: faqSpec },
  { id: 'legal', label: 'Envíos y términos', path: 'content/legal', schema: LegalContent, defaults: defaultLegal, spec: legalSpec },
] as const;

export default function Content({ param }: { param?: string }) {
  const tab = TABS.find((t) => t.id === param) ?? TABS[0];
  return (
    <>
      <PageHead title="Textos y fotos" description="Todo el contenido del sitio, en español e inglés. Si dejas el inglés vacío, se muestra el español." />
      <div className="a-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={t.id === tab.id} onClick={() => go(`contenido/${t.id}`)}>
            {t.label}
          </button>
        ))}
      </div>
      <DocEditor key={tab.id} path={tab.path} schema={tab.schema as never} defaults={tab.defaults as never} spec={tab.spec} />
    </>
  );
}
