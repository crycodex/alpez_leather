# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro 7 (SSR + ISR en Vercel), Firebase (Auth, Firestore, Storage), GSAP para movimiento. Panel admin como isla React. Fijado por el usuario.

## Users

- **Compradores en Ecuador** que conocen la marca por Instagram (@alpez_leather) y quieren ver el catálogo completo, precios y variantes antes de escribir por WhatsApp.
- **Turistas y visitantes de Cotacachi** (ciudad del cuero en Imbabura) que buscan piezas auténticas hechas en origen; muchos leen en inglés.
- **El dueño / equipo de Alpez** que administra productos, fotos, categorías, textos y ajustes, y revisa estadísticas de visitas y pedidos desde el panel.

## Product Purpose

Mostrar el catálogo de artículos de cuero (carteras, bolsos, manillas, correas y más) y convertir la intención de compra en un pedido por WhatsApp con el detalle ya armado (productos, variantes, cantidades, total en USD). Éxito: más pedidos claros por WhatsApp y menos ida y vuelta preguntando precios.

## Positioning

Fabricantes directos en Cotacachi, Ecuador: diseño propio en cuero de alta calidad, hecho en el taller, sin intermediarios.

## Operating Context

- El cierre de venta ocurre en WhatsApp (wa.me/593962227312); la web no cobra en línea.
- Instagram es el canal principal de descubrimiento (303 publicaciones, ~3.4k seguidores al 2026-11).
- El dueño carga contenido desde el celular o computador; el panel debe ser simple y bilingüe (ES/EN) en los campos.

## Capabilities and Constraints

- Catálogo con categorías administrables, precios visibles en USD y variantes opcionales (color, talla…).
- Carrito persistente que redirige a WhatsApp con el pedido formateado.
- Sitio público en español (por defecto) e inglés.
- Panel admin: productos, categorías, textos de todas las secciones, ajustes (WhatsApp, redes, SEO), pedidos y estadísticas.
- Sin pasarela de pago. Sin cuentas de cliente.

## Brand Commitments

- Logo existente: `public/imgs/icon.jpeg` (montaña + wordmark serif "ALPEZ / LEATHER").
- Colores de referencia del logo: arena (~#D9BFA0) y marrón chocolate (~#5A3624). Fijados por el usuario.
- Carácter pedido: moderno, minimalista, fluido.
- Voz: cercana y orgullosa del oficio, sin exagerar.

## Evidence on Hand

- Logo y bio de Instagram: "Diseños en cuero de alta calidad. Somos fabricantes directos. Cotacachi/Ecuador".
- **No existen aún**: fotos de producto o taller, historia de la marca, precios, catálogo real, testimonios, políticas de envío/devoluciones, dirección y horarios, traducciones al inglés. No se inventan; se marcan como pendientes.

## Product Principles

1. El producto es el protagonista: el cuero, su textura y su factura se ven antes que cualquier adorno.
2. Del interés al WhatsApp en el menor número de pasos, con el pedido ya claro.
3. Origen verificable: Cotacachi y el taller son el argumento, contado con hechos reales.
4. Todo lo editable vive en el panel; nada de textos atrapados en el código.

## Accessibility & Inclusion

WCAG 2.1 AA. Respetar `prefers-reduced-motion`. Contenido legible sin JavaScript en el sitio público.
