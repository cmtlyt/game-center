<script setup lang="ts">
const props = defineProps<{
  src?: string;
}>();
</script>

<template>
  <NuxtImg
    v-if="props.src"
    format="avif"
    v-bind="$props"
  />
</template>
