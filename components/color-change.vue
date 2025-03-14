<template>
  <ClIconBtn
    v-if="$colorMode.value === 'light'"
    name="material-symbols:light-mode-outline"
    @click="$colorMode.preference = 'dark'"
  />
  <ClIconBtn
    v-else
    name="material-symbols:dark-mode"
    @click="$colorMode.preference = 'light'"
  />
</template>
