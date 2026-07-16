// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://bestwebsiteaward.com',
  output: 'static',
  adapter: vercel(),
  trailingSlash: 'never',
  integrations: [
    sitemap({
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
