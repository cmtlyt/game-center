<script setup lang="ts">
/**
 * 骰子组件
 * 功能：点击骰子返回数字数组
 */

interface Props {
  amount?: number; // 骰子数量
  size?: number; // 骰子尺寸
  gap?: number; // 骰子之间的间距
  column?: number; // 每行骰子数量
  disable?: boolean; // 是否禁用
  duration?: number; // 动画时长
}

const props = withDefaults(defineProps<Props>(), {
  amount: 1,
  size: 100,
  gap: 10,
  column: 2,
  disable: false,
  duration: 1000,
});

const emit = defineEmits<{
  finish: [results: number[]];
  beforeRoll: [];
}>();

// 根据骰子数量初始化结果数组
const results = Array.from({ length: props.amount }, () => 1);

// 存储每个骰子的旋转状态
const diceRotationStateList = ref(Array.from({ length: props.amount }, () => ({
  x: 0,
  y: 0,
  z: 0,
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

  const rollPromises = Array.from({ length: props.amount }, (_, index) => {
    return new Promise<number>((resolve) => {
      diceRotationStateList.value[index].running = true;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;

        if (elapsed < props.duration) {
          // 动画过程中的随机旋转
          diceRotationStateList.value[index].x = Math.random() * 360;
          diceRotationStateList.value[index].y = Math.random() * 360;
          diceRotationStateList.value[index].z = Math.random() * 360;

          requestAnimationFrame(animate);
        }
        else {
          results[index] = Math.floor(Math.random() * 6) + 1;
          setFinalRotation(index, 'front');
          diceRotationStateList.value[index].running = false;
          resolve(results[index]);
        }
      };

      requestAnimationFrame(animate);
    });
  });

  await Promise.all(rollPromises);
  emit('finish', [...results]);
}

// 设置最终旋转角度使指定面朝上
function setFinalRotation(index: number, face: keyof typeof FACE_DOT_POSITIONS) {
  const rotationMap = {
    front: { x: 0, y: 0, z: 0 },
    back: { x: 0, y: 180, z: 0 },
    right: { x: 0, y: 90, z: 0 },
    left: { x: 0, y: -90, z: 0 },
    top: { x: 90, y: 0, z: 0 },
    bottom: { x: -90, y: 0, z: 0 },
  };

  const rotation = rotationMap[face];
  diceRotationStateList.value[index] = { ...rotation, running: false };
}

// 修改骰子旋转样式计算
function getCubeStyle(index: number) {
  return {
    transform: `rotateX(${diceRotationStateList.value[index].x}deg) 
              rotateY(${diceRotationStateList.value[index].y}deg) 
              rotateZ(${diceRotationStateList.value[index].z}deg)`,
  };
}

function handleClick() {
  if (props.disable)
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
      v-for="(_, index) in Array(props.amount)"
      :key="index"
      class="dice"
      :class="{ rolling: diceRotationStateList[index].running }"
      :style="{ width: `${size}rem`, height: `${size}rem` }"
      @click="handleClick"
    >
      <div class="dice-cube" :style="getCubeStyle(index)">
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
  perspective: 10000rem;
  cursor: pointer;
}

.dice-cube {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.3s ease-out;
}

.dice.rolling .dice-cube {
  animation: rolling 2s ease-in-out;
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
    transform: rotateX(360deg) rotateY(180deg) rotateZ(90deg);
  }
  50% {
    transform: rotateX(720deg) rotateY(360deg) rotateZ(180deg);
  }
  75% {
    transform: rotateX(1080deg) rotateY(540deg) rotateZ(270deg);
  }
  100% {
    transform: rotateX(1440deg) rotateY(720deg) rotateZ(360deg);
  }
}
</style>
