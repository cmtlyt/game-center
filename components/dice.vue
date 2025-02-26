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
const diceRotationStateList = ref(Array.from({ length: props.count }, () => ({
  running: false,
})));

const DICE_NUMBER_POSITIONS = {
  1: ['center'],
  2: ['top-left', 'bottom-right'],
  3: ['top-left', 'center', 'bottom-right'],
  4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
  6: ['top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right'],
} as const;

const COMMON_SIX_DOTS = ['top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right'] as const;

const FACE_DOT_POSITIONS = {
  front: (num: number) => DICE_NUMBER_POSITIONS[num as keyof typeof DICE_NUMBER_POSITIONS] || [],
  back: COMMON_SIX_DOTS,
  right: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
  left: COMMON_SIX_DOTS,
  top: COMMON_SIX_DOTS,
  bottom: COMMON_SIX_DOTS,
} as const;

// 点渲染大小
const dotSize = props.size * 0.15;

// 骰子投掷动画
async function roll() {
  if (diceRotationStateList.value.some(r => r.running))
    return;

  emit('beforeRoll');

  // 提前生成所有骰子的最终结果
  const finalResults = Array.from({ length: props.count }, () => Math.floor(Math.random() * 6) + 1);

  for (let i = 0; i < props.count; i++) {
    diceRotationStateList.value[i].running = true;
    results[i] = finalResults[i];
  }

  return new Promise<number[]>((resolve) => {
    setTimeout(() => {
      // 动画结束，设置最终旋转状态
      for (let i = 0; i < props.count; i++) {
        diceRotationStateList.value[i].running = false;
      }

      emit('finish', [...finalResults]);
      resolve([...finalResults]);
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

const containerStyle = computed(() => ({
  gap: `${props.gap}px`,
  gridTemplateColumns: `repeat(${props.column}, 1fr)`,
}));

defineExpose({
  roll,
});
</script>

<template>
  <div
    class="dice-container"
    :style="containerStyle"
  >
    <div
      v-for="(_, index) in Array(props.count)"
      :key="index"
      class="dice"
      :class="{ rolling: diceRotationStateList[index].running }"
      :style="{ width: `${size}rem`, height: `${size}rem` }"
      @click="handleClick"
    >
      <div class="dice-cube">
        <template v-for="face in ['front', 'back', 'right', 'left', 'top', 'bottom'] as const" :key="face">
          <div class="face" :class="face">
            <div
              v-for="position in getFaceDotPositions(face, index)"
              :key="position"
              class="dot"
              :class="position"
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
  transform: rotateY(0deg) translateZ(calc(v-bind(size) / 2 * 1rem));
}

.back {
  transform: rotateY(180deg) translateZ(calc(v-bind(size) / 2 * 1rem));
}

.right {
  transform: rotateY(90deg) translateZ(calc(v-bind(size) / 2 * 1rem));
}

.left {
  transform: rotateY(-90deg) translateZ(calc(v-bind(size) / 2 * 1rem));
}

.top {
  transform: rotateX(90deg) translateZ(calc(v-bind(size) / 2 * 1rem));
}

.bottom {
  transform: rotateX(-90deg) translateZ(calc(v-bind(size) / 2 * 1rem));
}

.dot {
  position: absolute;
  background: #333;
  border-radius: 50%;
  grid-area: var(--position);
}

.center {
  top: calc(50% - v-bind(dotSize) / 2 * 1rem);
  left: calc(50% - v-bind(dotSize) / 2 * 1rem);
}

.top-left {
  top: calc(v-bind(size) * 0.1 * 1rem);
  left: calc(v-bind(size) * 0.1 * 1rem);
}

.top-right {
  top: calc(v-bind(size) * 0.1 * 1rem);
  right: calc(v-bind(size) * 0.1 * 1rem);
}

.center-left {
  top: calc(50% - v-bind(dotSize) / 2 * 1rem);
  left: calc(v-bind(size) * 0.1 * 1rem);
}

.center-right {
  top: calc(50% - v-bind(dotSize) / 2 * 1rem);
  right: calc(v-bind(size) * 0.1 * 1rem);
}

.bottom-left {
  bottom: calc(v-bind(size) * 0.1 * 1rem);
  left: calc(v-bind(size) * 0.1 * 1rem);
}

.bottom-right {
  bottom: calc(v-bind(size) * 0.1 * 1rem);
  right: calc(v-bind(size) * 0.1 * 1rem);
}

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
    transform: rotateX(540deg) rotateY(270deg) rotateZ(135deg);
  }
  85% {
    transform: rotateX(630deg) rotateY(315deg) rotateZ(157.5deg);
  }
  100% {
    transform: rotateX(720deg) rotateY(360deg) rotateZ(180deg);
  }
}
</style>
