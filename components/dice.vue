<script setup lang="ts">
/**
 * 骰子组件
 * 功能：点击骰子返回数字数组
 */

interface Props {
  count?: number; // 骰子数量
  size?: number; // 骰子尺寸
  gap?: number; // 骰子之间的间距
  column?: number; // 每行骰子数量
  disabled?: boolean; // 是否禁用
  duration?: number; // 动画时长
}

const props = withDefaults(defineProps<Props>(), {
  count: 1,
  size: 100,
  gap: 10,
  column: 2,
  disabled: false,
  duration: 1000,
});

const emit = defineEmits<{
  finish: [results: number[]];
  beforeRoll: [];
}>();

// 根据骰子数量初始化结果数组
const results = Array.from({ length: props.count }, () => 1);

// 当前正在执行的 Promise
const currentRoll = shallowRef<Promise<number[]>>();

/**
 * 骰子各点数对应的点的位置定义
 * 键为点数(1-6)，值为点的位置数组
 */
const DICE_NUMBER_POSITIONS = {
  1: ['center'],
  2: ['top-left', 'bottom-right'],
  3: ['top-left', 'center', 'bottom-right'],
  4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
  6: ['top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right'],
} as const;

/**
 * 骰子各个面的点位置定义
 */
const FACE_DOT_POSITIONS = {
  front: (num: number) => DICE_NUMBER_POSITIONS[num as keyof typeof DICE_NUMBER_POSITIONS] || [],
  back: DICE_NUMBER_POSITIONS[6],
  right: DICE_NUMBER_POSITIONS[5],
  left: DICE_NUMBER_POSITIONS[6],
  top: DICE_NUMBER_POSITIONS[6],
  bottom: DICE_NUMBER_POSITIONS[6],
} as const;

// CSS 变量
const diceHalfSize = `${props.size / 2}rem`;
const animationIterationCount = props.duration / 600;

// 骰子投掷动画
async function roll() {
  if (currentRoll.value) {
    return currentRoll.value;
  }

  for (let i = 0; i < props.count; i++) {
    results[i] = Math.floor(Math.random() * 6) + 1;
  }

  currentRoll.value = new Promise<number[]>((resolve) => {
    setTimeout(() => {
      emit('finish', [...results]);
      resolve([...results]);
      currentRoll.value = undefined;
    }, props.duration);
  });

  return currentRoll;
}

function handleClick() {
  if (props.disabled)
    return;
  emit('beforeRoll');
  roll();
}

// 获取指定面的点位置数组
function getFaceDotPositions(face: keyof typeof FACE_DOT_POSITIONS, index: number) {
  const currentNumber = face === 'front' ? results[index] : undefined;
  const positions = FACE_DOT_POSITIONS[face];
  return typeof positions === 'function' ? positions(currentNumber!) : positions;
}

defineExpose({
  roll,
});
</script>

<template>
  <div
    class="dice-container"
    :style="{
      'gridTemplateColumns': `repeat(${props.column}, 1fr)`,
      '--dice-size': `${size}rem`,
      '--dice-half-size': diceHalfSize,
      '--dot-size': '15%',
      '--dice-padding': '10%',
      '--animation-iteration-count': animationIterationCount,
      '--gap': `${props.gap}px`,
    }"
  >
    <div
      v-for="(_, index) in props.count"
      :key="index"
      class="dice"
      :class="{ rolling: currentRoll }"
      @click="handleClick"
    >
      <div class="dice-cube">
        <template v-for="nowFace in ['front', 'back', 'right', 'left', 'top', 'bottom'] as const" :key="nowFace">
          <div class="face" :class="[nowFace]">
            <div
              v-for="position in getFaceDotPositions(nowFace, index)"
              :key="position"
              class="dot"
              :class="[position]"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dice-container {
  display: grid;
  width: fit-content;
  gap: var(--gap);
}

.dice {
  perspective: 250rem;
  cursor: pointer;
  width: var(--dice-size);
  height: var(--dice-size);
}

.dice-cube {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.5s ease-out;
}

.dice.rolling .dice-cube {
  animation-name: rolling;
  animation-timing-function: cubic-bezier(0.17, 0.67, 0.83, 0.67);
  animation-duration: 0.6s;
  animation-iteration-count: var(--animation-iteration-count);
  animation-fill-mode: forwards;
  cursor: not-allowed;
}

.face {
  position: absolute;
  width: 100%;
  height: 100%;
  background: white;
  border: 0.125rem solid #e0e0e0;
  border-radius: 10%;
  display: grid;
  grid-template: repeat(3, 1fr) / repeat(3, 1fr);
  gap: var(--dot-size);
  backface-visibility: visible;
  box-shadow: inset 0 0 0.9375rem rgba(0, 0, 0, 0.1);
}

.front {
  transform: rotateY(0deg) translateZ(var(--dice-half-size));
}

.back {
  transform: rotateY(180deg) translateZ(var(--dice-half-size));
}

.right {
  transform: rotateY(90deg) translateZ(var(--dice-half-size));
}

.left {
  transform: rotateY(-90deg) translateZ(var(--dice-half-size));
}

.top {
  transform: rotateX(90deg) translateZ(var(--dice-half-size));
}

.bottom {
  transform: rotateX(-90deg) translateZ(var(--dice-half-size));
}

.dot {
  width: var(--dot-size);
  height: var(--dot-size);
  position: absolute;
  background: #333;
  border-radius: 50%;
}

.center {
  top: calc(50% - var(--dot-size) / 2);
  left: calc(50% - var(--dot-size) / 2);
}

.top-left {
  top: var(--dice-padding);
  left: var(--dice-padding);
}

.top-right {
  top: var(--dice-padding);
  right: var(--dice-padding);
}

.center-left {
  top: calc(50% - var(--dot-size) / 2);
  left: var(--dice-padding);
}

.center-right {
  top: calc(50% - var(--dot-size) / 2);
  right: var(--dice-padding);
}

.bottom-left {
  bottom: var(--dice-padding);
  left: var(--dice-padding);
}

.bottom-right {
  bottom: var(--dice-padding);
  right: var(--dice-padding);
}

@keyframes rolling {
  @for $i from 0 through 10 {
    #{($i * 10) + '%'} {
      transform: rotateX(#{$i * 72}deg) rotateY(#{$i * 36}deg) rotateZ(#{$i * 18}deg);
    }
  }
}
</style>
