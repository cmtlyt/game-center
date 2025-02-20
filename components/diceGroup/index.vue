<script setup lang='ts'>
/**
 * 骰子组合
 * 功能：
 *  1. 点击骰子其他骰子也会投掷
 *  2. 全部完成之后返回总和
 */
export interface DiceGroupProps {
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
  finish: [result: number];
}>();
const diceRefs = ref<any[]>(Array.from({ length: props.count }, () => null));
const dice = ref(Array.from({ length: props.count }, () => 0));
const rollingCount = ref(0);

/** 点击任一骰子，所有骰子都会投掷 */
function handleClick() {
  if (!diceRefs.value?.length)
    return;

  rollingCount.value = 0;
  dice.value = Array.from({ length: props.count }, () => 0);

  diceRefs.value.forEach((dice) => {
    if (dice)
      dice.roll();
  });
}

/** 将每个骰子投掷结果记录 */
function hanleDiceFinish(result: number, index: number) {
  dice.value[index] = result;
  rollingCount.value++;

  if (rollingCount.value === props.count) {
    const sum = dice.value.reduce((acc, cur) => acc + cur, 0);
    emit('finish', sum);
  }
}
</script>

<template>
  <div
    class="dice-group-container"
    :style="{
      gap: `${props.gap}px`,
      gridTemplateColumns: `repeat(${props.column}, 1fr)`,
    }"
  >
    <Dice
      v-for="(item, index) in Array(props.count).fill(0)"
      :key="index"
      :ref="el => diceRefs[index] = el"
      :enable="true"
      :group-mode="true"
      :size="size"
      :on-finish="(res) => hanleDiceFinish(res, index)"
      @click="handleClick"
    />
  </div>
</template>

<style scoped lang='less'>
.dice-group-container {
  display: grid;
  width: fit-content;
}
</style>
