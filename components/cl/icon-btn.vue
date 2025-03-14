<script setup lang="ts">
const props = withDefaults(defineProps<{
  name: string;
  iconSize?: string;
}>(), {
  iconSize: '100%',
});
</script>

<template>
  <Button
    class="icon-btn"
    un-p="!4rem"
    un-size="28rem"
    :style="{ '--icon-size': props.iconSize }"
    severity="contrast" variant="outlined"
  >
    <Icon :name="name" class="icon" />
  </Button>
</template>

<style scoped lang="scss">
.icon-btn {
  .icon {
    width: var(--icon-size);
    height: var(--icon-size);
    aspect-ratio: 1 / 1;
  }
}
</style>
