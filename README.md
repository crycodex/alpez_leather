# Alpez Leather — sitio web + tienda + panel admin

Sitio de **Alpez Leather** (artículos de cuero hechos en Cotacachi, Ecuador): landing, catálogo con carrito que envía el pedido por **WhatsApp**, página «Nosotros» y un **panel de administración** donde se gestionan productos, categorías, textos, ajustes, pedidos y estadísticas. Bilingüe (español/inglés).

| Capa | Tecnología |
|---|---|
| Sitio | [Astro 7](https://docs.astro.build) (SSR + ISR) |
| Datos | Firebase Firestore |
| Fotos | Firebase Storage |
| Acceso admin | Firebase Auth (correo + contraseña) |
| Panel | Isla React dentro de Astro |
| Animación | GSAP (ScrollTrigger, SplitText) + Lenis |
| Hosting | Vercel (`@astrojs/vercel`, ISR + optimización de imágenes) |

## Arranque rápido

```bash
npm install
cp .env.example .env        # completa los valores (ver docs/FIREBASE.md)
astro dev --background      # o: npm run dev
```

- Sitio: http://localhost:4321 · Inglés: http://localhost:4321/en/
- Panel: http://localhost:4321/admin

**Sin Firebase configurado** el sitio funciona en *modo demo* con el contenido de ejemplo de `src/data/defaults.ts` (todo marcado «Pendiente»). El panel muestra una pantalla indicando que falta la configuración.

### Probar todo en local con emuladores (sin proyecto real)

```bash
npm run emulators                                   # terminal 1 (requiere Java)
# terminal 2:
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
       FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199 FIREBASE_PROJECT_ID=demo-alpez \
       PUBLIC_FIREBASE_PROJECT_ID=demo-alpez PUBLIC_FIREBASE_STORAGE_BUCKET=demo-alpez.appspot.com \
       PUBLIC_USE_FIREBASE_EMULATORS=true
npm run seed
npm run create-admin -- admin@alpez.test "una-contraseña"
npm run dev
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (salida para Vercel) |
| `npm run check` | Verificación de tipos (Astro + TS) |
| `npm run seed` | Copia el contenido inicial a Firestore (`-- --force` sobrescribe) |
| `npm run create-admin -- correo "contraseña"` | Crea o promueve un administrador |
| `npm run emulators` | Emuladores de Firebase (Auth, Firestore, Storage) |
| `npm run deploy:rules` | Publica reglas de Firestore/Storage |

## Documentación

- [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) — cómo está hecho: render, datos, carrito → WhatsApp, estadísticas.
- [docs/FIREBASE.md](docs/FIREBASE.md) — crear el proyecto, reglas, primer admin, seed.
- [docs/DESPLIEGUE-VERCEL.md](docs/DESPLIEGUE-VERCEL.md) — variables de entorno, ISR, dominio.
- [docs/MANUAL-ADMIN.md](docs/MANUAL-ADMIN.md) — guía para el dueño: cómo usar el panel.
- [docs/PENDIENTES.md](docs/PENDIENTES.md) — contenido y decisiones que faltan.
- [PRODUCT.md](PRODUCT.md) — producto, usuarios, principios.
- [DESIGN.md](DESIGN.md) — sistema visual «Golpe de marca».

## Estructura

```
src/
  pages/            rutas (es en raíz, en/ para inglés), admin/, api/
  views/            páginas compartidas por ambos idiomas (Home, Shop, Product…)
  components/site/  componentes del sitio público (Astro)
  components/admin/ panel de administración (React)
  layouts/Base.astro
  lib/schemas.ts    modelo de datos (zod) compartido sitio/API/admin
  lib/server/       Firebase Admin, lectura de datos, auth, utilidades HTTP
  lib/firebase/     Firebase cliente (panel)
  lib/whatsapp.ts   mensaje de pedido
  stores/cart.ts    carrito (nanostores + localStorage)
  scripts/          movimiento (GSAP/Lenis), carrito, estadísticas
  i18n/             textos de interfaz y rutas por idioma
  data/defaults.ts  contenido inicial / modo demo
  styles/           tokens, estilos globales y del panel
scripts/            seed y create-admin
firestore.rules · storage.rules · firebase.json
```
