## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Proyecto Alpez Leather

- Arquitectura, datos y flujos: `docs/ARQUITECTURA.md`. Producto: `PRODUCT.md`. Sistema visual: `DESIGN.md`.
- El modelo de datos vive en `src/lib/schemas.ts` (zod) y lo comparten sitio, APIs y panel. Al agregar un campo editable, actualízalo ahí, en `src/data/defaults.ts` y en el spec del formulario del panel (`src/components/admin/Content.tsx` o `Settings.tsx`).
- Textos de interfaz en `src/i18n/ui.ts` (es/en); rutas localizadas en `src/i18n/index.ts`.
- Sin credenciales de Firebase el sitio corre en modo demo con `src/data/defaults.ts`.
- No inventar precios, testimonios ni historia: lo que falte va marcado `pending: true`.
