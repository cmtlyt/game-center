// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  builder: 'vite',
  compatibilityDate: '2024-11-01',
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
  },
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
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
