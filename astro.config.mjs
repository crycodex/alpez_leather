// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

const bypassToken = process.env.VERCEL_REVALIDATE_TOKEN;

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://alpezleather.com',
  output: 'server',
  adapter: vercel({
    imageService: true,
    // ISR: las páginas públicas se cachean en el CDN de Vercel y se regeneran
    // cada 5 min o bajo demanda desde el admin ("Publicar cambios").
    isr: bypassToken
      ? {
          expiration: 300,
          bypassToken,
          exclude: [/^\/api\/.*/, /^\/admin.*/],
        }
      : false,
  }),
  integrations: [react({ include: ['**/components/admin/**'] })],
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  image: {
    domains: ['firebasestorage.googleapis.com', 'storage.googleapis.com'],
  },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
});
