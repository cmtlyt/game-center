<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/nuxt';

useSeoMeta({
  description: 'cmtlyt 的游戏中心',
  ogTitle: '游戏中心',
  ogDescription: 'cmtlyt 的游戏中心',
  ogImage: '/favicon.ico',
  ogUrl: 'http://localhost:3000',
  twitterTitle: '游戏中心',
  twitterDescription: 'cmtlyt 的游戏中心',
  twitterImage: '/favicon.ico',
  twitterCard: 'summary',
});

useHead({
  title: '游戏中心',
  htmlAttrs: {
    lang: 'en',
  },
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
  ],
});
</script>

<template>
  <SpeedInsights />
  <NuxtPage />
  <Toast />
</template>

<style lang="scss" src="@/assets/styles/main.scss"></style>

<style lang="scss">
.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
</style>
