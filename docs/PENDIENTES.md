# Pendientes

Lo que falta para salir a producción. Todo lo de contenido se carga desde el panel; nada requiere tocar código.

## Configuración (bloquea el lanzamiento)

- [ ] Crear el proyecto Firebase y completar `.env` → [FIREBASE.md](FIREBASE.md)
- [ ] Publicar reglas (`npm run deploy:rules`), correr `npm run seed` y crear el admin
- [ ] Proyecto en Vercel con sus variables → [DESPLIEGUE-VERCEL.md](DESPLIEGUE-VERCEL.md)
- [ ] Dominio definitivo (¿`alpezleather.com`?) → actualizar `PUBLIC_SITE_URL` y los dominios autorizados de Firebase

## Contenido (el sitio ya lo muestra como «Pendiente»)

- [ ] **Catálogo real**: productos, precios en USD, variantes (colores/tallas), medidas, materiales
- [ ] **Fotos de producto** (mínimo 3 por pieza, vertical 4:5)
- [ ] Borrar o reemplazar los 6 **productos de ejemplo** («… (ejemplo)»)
- [ ] Foto de portada por categoría (opcional)
- [ ] Confirmar las categorías: Carteras, Bolsos, Manillas, Correas, **Accesorios** (esta última es supuesta: ¿billeteras, llaveros…?)
- [ ] **Nosotros**: historia de la marca, foto principal horizontal, texto sobre Cotacachi y el taller, 4 fotos del taller
- [ ] **El oficio** (inicio): texto real de los 4 pasos y una foto del taller
- [ ] **Preguntas frecuentes**: envíos, formas de pago, personalización
- [ ] **Envíos y devoluciones** y **Términos y condiciones**
- [ ] Dirección exacta, horario de atención y correo (Ajustes)
- [ ] Revisar las traducciones al inglés (los textos de la interfaz ya están traducidos; los de contenido de ejemplo también, pero conviene revisarlos)
- [ ] Imagen para compartir en redes (1200 × 630), opcional

## Decisiones abiertas

- Instagram no permite leer publicaciones sin iniciar sesión, así que no se importó contenido de ahí. Si quieres un bloque con las últimas publicaciones, hace falta la API de Instagram (Meta) con un token de la cuenta. El bloque actual enlaza al perfil.
- Métodos de pago y costos de envío: hoy se coordinan por WhatsApp. Si en el futuro se quiere cobrar en línea, se puede integrar una pasarela (Payphone, Kushki, PayPal) sobre el mismo carrito.
- Notificaciones de pedido por correo: hoy el pedido llega por WhatsApp y queda en el panel; si se quiere también un correo, se puede agregar con una Cloud Function o un servicio como Resend.

## Procedencia de imágenes

| Archivo | Origen |
|---|---|
| `public/imgs/icon.jpeg` | Logo original entregado por el cliente |
| `public/brand/logo-*.png`, `mark-*.png`, `word-*.png` | Recortes del logo original con fondo transparente (extraídos por luminancia con Pillow), en chocolate `#5A3624` y arena `#D9BFA0` |
| `public/brand/apple-touch-icon.png`, `icon-512.png`, `og-default.jpg` | Logo original compuesto sobre arena `#D9BFA0` |
| `public/favicon.svg` | Montaña del logo redibujada en SVG |

No hay fotografías de stock ni imágenes generadas: todas las fotos de producto están pendientes.
