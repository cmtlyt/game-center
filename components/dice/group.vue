<script setup lang='ts'>
/**
 * 骰子组合
 * 功能：
 *  1. 点击骰子其他骰子也会投掷
 *  2. 全部完成之后返回总和
 */
interface DiceGroupProps {
  count?: number; // 骰子数量
  size?: number; // 骰子尺寸
  gap?: number; // 骰子之间的间距
  column?: number; // 每行骰子数量
}

const props = withDefaults(defineProps<DiceGroupProps>(), {
  count: 2,
  size: 100,
  gap: 10,
  column: 2,
});

const emit = defineEmits<{
  finish: [result: number[]];
}>();
const diceRefs = ref<any[]>(Array.from({ length: props.count }, () => null));
let dice = Array.from({ length: props.count }, () => 0);
let rollingCount = 0;

/** 点击任一骰子，所有骰子都会投掷 */
function handleClick() {
  if (!diceRefs.value?.length)
    return;

  rollingCount = 0;
  dice = Array.from({ length: props.count }, () => 0);

  diceRefs.value.forEach((dice) => {
    dice?.roll();
  });
}

/** 将每个骰子投掷结果记录 */
function hanleDiceFinish(result: number, index: number) {
  dice[index] = result;
  rollingCount++;

  if (rollingCount === props.count) {
    emit('finish', dice);
  }
}
</script>

<template>
  <div
    class="dice-group-container"
    :style="{
      gap: `${gap}px`,
      gridTemplateColumns: `repeat(${column}, 1fr)`,
    }"
  >
    <Dice
      v-for="(_, index) in count"
      :key="index"
      :ref="diceRefs[index]"
      enable
      group-mode
      :size="size"
      @finish="(res) => hanleDiceFinish(res, index)"
      @click="handleClick"
    />
  </div>
</template>

<style scoped lang='scss'>
.dice-group-container {
  display: grid;
  width: fit-content;
}
</style>
