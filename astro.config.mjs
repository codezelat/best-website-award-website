// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://bestwebsiteaward.com',
  output: 'static',
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
    build: {
      cssMinify: 'lightningcss'
    }
  }
});
