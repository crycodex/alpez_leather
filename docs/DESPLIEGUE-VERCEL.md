# Despliegue en Vercel

## 1. Importar el repositorio

1. Sube el proyecto a GitHub.
2. En https://vercel.com → **Add New → Project** → importa el repositorio. Vercel detecta Astro solo (build `astro build`, salida `.vercel/output` que genera el adaptador).
3. Node.js: 22 o superior (Project Settings → General → Node.js Version).

## 2. Variables de entorno

Project Settings → **Environment Variables** (Production y Preview):

| Variable | Valor |
|---|---|
| `PUBLIC_SITE_URL` | `https://alpezleather.com` (o el dominio final) |
| `PUBLIC_FIREBASE_*` (6) | Ver docs/FIREBASE.md |
| `FIREBASE_PROJECT_ID` | ID del proyecto |
| `FIREBASE_CLIENT_EMAIL` | De la cuenta de servicio |
| `FIREBASE_PRIVATE_KEY` | La clave completa, con `\n` literales |
| `FIREBASE_STORAGE_BUCKET` | Bucket de Storage |
| `VERCEL_REVALIDATE_TOKEN` | Cadena aleatoria de 32+ caracteres; activa ISR y el botón «Publicar» |

Generar el token: `openssl rand -hex 24`.

> `PUBLIC_*` y `VERCEL_REVALIDATE_TOKEN` se leen al compilar. Si los cambias, vuelve a desplegar.

## 3. Dominio

Project Settings → **Domains** → agrega el dominio y sigue las instrucciones de DNS. Después agrégalo en Firebase → Authentication → Dominios autorizados.

## 4. Verificar después del despliegue

- [ ] `/` y `/en/` cargan con el contenido de Firestore.
- [ ] `/admin` permite iniciar sesión con la cuenta creada con `create-admin`.
- [ ] Editar un texto → **Publicar cambios** → el cambio se ve al recargar el sitio.
- [ ] Agregar al carrito → «Enviar por WhatsApp» abre WhatsApp con el mensaje y el pedido aparece en **Pedidos**.
- [ ] **Resumen** muestra visitas (puede tardar unos segundos).
- [ ] `/sitemap.xml` lista las páginas con el dominio correcto.

## Cómo funciona la caché

- Las páginas públicas se sirven desde el CDN y se regeneran cada 5 minutos.
- «Publicar cambios» las regenera al instante.
- Sin `VERCEL_REVALIDATE_TOKEN`, cada visita se renderiza en el momento (más lento y más uso de funciones, pero siempre actualizado).

## Imágenes

`imageService: true` usa la optimización de imágenes de Vercel para las fotos de Firebase Storage (tamaños responsivos, WebP/AVIF). El plan Hobby incluye una cuota mensual de optimizaciones; para un catálogo pequeño suele bastar.
