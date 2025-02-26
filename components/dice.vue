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

// 存储每个骰子的旋转状态
const isRolling = ref(false);

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
  right: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
  left: DICE_NUMBER_POSITIONS[6],
  top: DICE_NUMBER_POSITIONS[6],
  bottom: DICE_NUMBER_POSITIONS[6],
} as const;

/** 点渲染大小 */
const dotSize = props.size * 0.15;

// 骰子投掷动画
async function roll() {
  if (isRolling.value)
    return;

  isRolling.value = true;

  for (let i = 0; i < props.count; i++) {
    results[i] = Math.floor(Math.random() * 6) + 1;
  }

  return new Promise<number[]>((resolve) => {
    setTimeout(() => {
      // 动画结束，设置最终旋转状态
      isRolling.value = false;

      emit('finish', [...results]);
      resolve([...results]);
    }, props.duration);
  });
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
      gap: `${props.gap}px`,
      gridTemplateColumns: `repeat(${props.column}, 1fr)`,
    }"
  >
    <div
      v-for="(_, index) in Array(props.count)"
      :key="index"
      class="dice"
      :class="{ rolling: isRolling }"
      :style="{ width: `${size}rem`, height: `${size}rem` }"
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
              :style="{ width: `${dotSize}rem`, height: `${dotSize}rem` }"
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
}

.dice {
  perspective: 250rem;
  cursor: pointer;
  --dice-half-size: calc(v-bind(size) / 2 * 1rem);
  --dice-padding: calc(v-bind(size) * 0.1 * 1rem);
  --dot-center-offset: calc(50% - v-bind(dotSize) / 2 * 1rem);
}

.dice-cube {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.5s ease-out;
}

.dice.rolling .dice-cube {
  animation: rolling calc(v-bind(duration) * 1ms) infinite;
  animation-fill-mode: forwards;
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
  gap: calc(v-bind(dotSize) * 1rem);
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
  position: absolute;
  background: #333;
  border-radius: 50%;
  grid-area: var(--position);
}

.center {
  top: var(--dot-center-offset);
  left: var(--dot-center-offset);
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
  top: var(--dot-center-offset);
  left: var(--dice-padding);
}

.center-right {
  top: var(--dot-center-offset);
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

// ... existing code ...
@keyframes rolling {
  0% {
    transform: rotateX(0) rotateY(0) rotateZ(0);
  }
  25% {
    transform: rotateX(180deg) rotateY(90deg) rotateZ(45deg);
  }
  50% {
    transform: rotateX(360deg) rotateY(180deg) rotateZ(90deg);
  }
  75% {
    transform: rotateX(540deg) rotateY(270deg) rotateZ(45deg);
  }

  100% {
    transform: rotateX(720deg) rotateY(360deg) rotateZ(0);
  }
}
</style>
