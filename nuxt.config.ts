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
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/styles/variables.scss" as *;',
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
  ],
});
