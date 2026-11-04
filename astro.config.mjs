import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import { frenchTypographyIntegration } from './src/integrations/french-typography.ts';

export default defineConfig({
  site: 'https://ssesolutions.fr',
  output: 'static',
  adapter: vercel(),
  integrations: [sitemap(), frenchTypographyIntegration()],
  build: {
    format: 'directory',
  },
  compressHTML: true,
});
