# Arquitectura

## Visión general

```
Visitante ──► Vercel CDN (ISR) ──► Función Astro (SSR) ──► Firestore (Admin SDK)
                                    │
                                    ├─ /api/checkout ─► guarda pedido + estadísticas ─► devuelve enlace wa.me
                                    ├─ /api/track    ─► incrementa contadores diarios
                                    └─ /api/revalidate (solo admin) ─► invalida caché ISR

Dueño ──► /admin (React, estático) ──► Firebase Auth + Firestore + Storage (SDK cliente, protegido por reglas)
```

## Render y caché

- `output: 'server'` con el adaptador de Vercel. Cada página pública se renderiza en servidor leyendo Firestore, así Google y las vistas previas de WhatsApp/Instagram reciben el HTML completo.
- **ISR**: Vercel guarda en caché cada página y la regenera cada 5 minutos (`expiration: 300`). Se activa solo si existe `VERCEL_REVALIDATE_TOKEN`.
- **Publicar cambios**: el botón del panel llama `POST /api/revalidate` con el token de sesión del admin. El servidor verifica que el usuario esté en `admins/{uid}` y hace `HEAD` con `x-prerender-revalidate` a todas las rutas (inicio, tienda, categorías, productos, en ambos idiomas, y el sitemap).
- Además, `src/lib/server/repo.ts` tiene una caché en memoria de 30 s por instancia.
- `/admin` y `/api/*` quedan fuera del ISR. `/admin` se prerenderiza como HTML estático y la app React se monta en el cliente (`client:only`).

## Datos

`src/lib/schemas.ts` define el modelo con **zod**; lo usan el sitio, las APIs y el panel. Todo texto visible es `{ es, en }`; si `en` está vacío se muestra `es`.

| Colección / doc | Contenido |
|---|---|
| `settings/site` | WhatsApp, redes, correo, dirección, horario, nota de envío, saludo del pedido, SEO |
| `content/home` | Hero, títulos, bloques «Fabricantes directos», «El oficio» (pasos), Instagram, cierre |
| `content/about` | Título, presentación, historia, valores, Cotacachi, fotos |
| `content/faq` | Preguntas frecuentes |
| `content/legal` | Envíos/devoluciones, términos |
| `categories/{id}` | Nombre, slug, descripción, portada, orden, visible, pendiente |
| `products/{id}` | Nombre, slug, categoría, descripción, detalles, precio, precio anterior, fotos, variantes, destacado, visible, disponibilidad, orden, pendiente |
| `orders/{id}` | Pedido enviado por WhatsApp (líneas, total, cliente, idioma, estado) |
| `stats_daily/{YYYY-MM-DD}` | Contadores del día (hora de Ecuador) |
| `admins/{uid}` | Lista de administradores |

**Lectura tolerante**: `repo.ts` mezcla lo guardado sobre `src/data/defaults.ts`. Si un documento falta o es inválido, el sitio no se cae: usa el valor por defecto y lo registra en el log.

**Modo demo**: sin credenciales ni emulador, `getDb()` devuelve `null` y todo sale de `defaults.ts`.

## Carrito → WhatsApp

1. `src/stores/cart.ts` (nanostores + localStorage) guarda las líneas con una copia del nombre, foto, variantes y precio, para pintar el carrito sin red.
2. El cliente pulsa «Enviar por WhatsApp» y completa nombre, ciudad (opcional) y nota (opcional).
3. `POST /api/checkout` **recalcula los precios con el catálogo real** (el precio del navegador no se usa), guarda el pedido en `orders`, suma estadísticas y arma el mensaje (`src/lib/whatsapp.ts`).
4. El navegador abre `https://wa.me/<número>?text=…`. En escritorio se abre una pestaña nueva antes de la llamada (para que no la bloquee el navegador); en móvil se navega directo, lo que abre la app.
5. Si el registro del pedido falla, el enlace de WhatsApp igual se entrega: la venta nunca se bloquea por las estadísticas.

Productos con precio `0` se muestran como «Precio por confirmar» y el mensaje lo indica.

## Estadísticas

- `src/scripts/track.ts` envía `page_view`, `product_view` y `add_to_cart` con `sendBeacon` a `/api/track`. No usa cookies ni servicios de terceros; no guarda IPs.
- `/api/track` descarta robots (por user-agent), peticiones de otro origen y abuso (límite por IP en memoria), y hace `increment()` en `stats_daily/{fecha}`: totales y mapas por producto (`views`, `carts`, `ordered`) y por idioma.
- El panel lee el rango de días y calcula KPIs, series diarias, embudo, top de productos e interés por categoría.

## i18n

- Astro i18n con `defaultLocale: 'es'`, sin prefijo para español.
- Rutas localizadas en `src/i18n/index.ts` (`/tienda` ↔ `/en/shop`, `/producto/x` ↔ `/en/product/x`, etc.).
- Las páginas en `src/pages` son delgadas; el contenido vive en `src/views/*View.astro` y recibe `locale`.
- `hreflang`, `canonical` y sitemap con alternos por idioma.

## Movimiento

`src/scripts/motion.ts`: Lenis para scroll suave, impulsado por el ticker de GSAP; atributos declarativos:

| Atributo | Efecto |
|---|---|
| `data-press-chars` | Titular del hero: cada letra se «presiona» (hundido) en secuencia |
| `data-hero-press` | El sello se hunde más con el scroll |
| `data-press` | Títulos que pasan de plano a hundido al entrar en vista |
| `data-reveal` | Fotos que se descubren de abajo hacia arriba |
| `data-rise` | Grupos que entran escalonados |
| `data-stitch` | Pespuntes que se «cosen» de izquierda a derecha |

Con `prefers-reduced-motion` no se anima nada y Lenis no se activa. El contenido es visible sin JavaScript. Con View Transitions (`ClientRouter`), todo se limpia en `astro:before-swap` y se reinicia en `astro:page-load`.

## Seguridad

- `firestore.rules`: lectura pública solo del catálogo y del contenido; escritura solo para `admins`. `orders` y `stats_daily` solo los lee un admin; del pedido solo puede cambiar `status`.
- `storage.rules`: lectura pública de `products/`, `categories/` y `content/`; subida solo para admins, solo imágenes de menos de 8 MB.
- Las APIs públicas validan con zod, comprueban el origen y limitan la frecuencia de peticiones. `/api/revalidate` exige un ID token válido de un admin.
- La clave de servicio de Firebase vive solo en variables de entorno del servidor.

## SEO

Metadatos y Open Graph por página; JSON-LD `Store`, `Product` (con `Offer` si hay precio), `ItemList` y `FAQPage`; `sitemap.xml` y `robots.txt` dinámicos.
