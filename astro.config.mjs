// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const sitemapExcludedPaths = new Set(['/privacy-policy', '/terms', '/cookies']);

export default defineConfig({
  site: 'https://bestwebsiteaward.com',
  output: 'static',
  trailingSlash: 'never',
  integrations: [
    sitemap({
      filter: (page) => !sitemapExcludedPaths.has(new URL(page).pathname.replace(/\/$/, '')),
      namespaces: {
        news: false,
        video: false,
        xhtml: false
      }
    })
  ],
  image: {
    responsiveStyles: true,
    layout: 'constrained'
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: 'lightningcss'
    }
  }
});
