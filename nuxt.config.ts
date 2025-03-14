import vue from '@vitejs/plugin-vue';
import preset from './themes/preset';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  builder: 'vite',
  compatibilityDate: '2024-11-01',
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
  },
  routeRules: {
    '/': { prerender: true },
  },
  nitro: {
    rollupConfig: {
      // eslint-disable-next-line ts/ban-ts-comment
      // @ts-ignore
      plugins: [
        vue(),
      ],
    },
    experimental: {
      websocket: true,
    },
  },
  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },
  unocss: {
    nuxtLayers: true,
    attributify: {
      prefix: 'un-',
    },
  },
  primevue: {
    options: {
      theme: {
        preset,
        options: {
          darkModeSelector: '.dark-mode',
        },
      },
    },
  },
  modules: [
    '@vueuse/nuxt',
    '@formkit/auto-animate',
    '@nuxt/image',
    '@nuxtjs/sitemap',
    '@nuxt/icon',
    '@unocss/nuxt',
    'nuxt-security',
    '@pinia/nuxt',
    '@primevue/nuxt-module',
    '@nuxtjs/color-mode',
    'v-satori/nuxt',
    'unplugin-font-to-buffer/nuxt',
  ],
});
