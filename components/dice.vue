<script setup lang="ts">
/**
 * 骰子组件
 * 功能：点击骰子返回数字数组
 */

interface Props {
  number?: number; // 骰子数量
  size?: number; // 骰子尺寸
  gap?: number; // 骰子之间的间距
  column?: number; // 每行骰子数量
  enable?: boolean; // 是否启用
  duration?: number; // 动画时长
}

const props = withDefaults(defineProps<Props>(), {
  number: 1,
  size: 100,
  gap: 10,
  column: 2,
  enable: true,
  duration: 1000,
});

const emit = defineEmits<{
  finish: [results: number[]];
  beforeRoll: [];
}>();

// 根据骰子数量初始化结果数组
const results = Array.from({ length: props.number }, () => 1);

// 存储每个骰子的旋转状态
const rotates = ref(Array.from({ length: props.number }, () => ({
  x: 0,
  y: 0,
  z: 0,
  running: false,
})));

// 随机选择一个面朝上
const FACES = ['front', 'back', 'right', 'left', 'top', 'bottom'] as const;
const getRandomFace = () => FACES[Math.floor(Math.random() * FACES.length)];

// 骰子点位置
const FACE_DOT_POSITIONS = {
  front: (num: number) => {
    switch (num) {
      case 1:
        return ['center'];
      case 2:
        return ['top-left', 'bottom-right'];
      case 3:
        return ['top-left', 'center', 'bottom-right'];
      case 4:
        return ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
      case 5:
        return ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'];
      case 6:
        return ['top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right'];
      default:
        return [];
    }
  },
  back: ['top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right'],
  right: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
  left: ['top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right'],
  top: ['top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right'],
  bottom: ['top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right'],
} as const;

// 点渲染大小
const dotSize = computed(() => props.size * 0.15);

// 骰子投掷动画
async function roll() {
  if (rotates.value.some(r => r.running))
    return;

  const rollPromises = Array.from({ length: props.number }, (_, index) => {
    return new Promise<number>((resolve) => {
      rotates.value[index].running = true;
      const startTime = performance.now();
      const targetFace = getRandomFace();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;

        if (elapsed < props.duration) {
          // 随机旋转角度
          rotates.value[index].x = Math.random() * 360;
          rotates.value[index].y = Math.random() * 360;
          rotates.value[index].z = Math.random() * 360;

          if (elapsed % 50 < 16) {
            results[index] = Math.floor(Math.random() * 6) + 1;
          }
          requestAnimationFrame(animate);
        }
        else {
          results[index] = Math.floor(Math.random() * 6) + 1;
          setFinalRotation(index, targetFace);
          rotates.value[index].running = false;
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
function setFinalRotation(index: number, face: typeof FACES[number]) {
  const rotationMap = {
    front: { x: 0, y: 0, z: 0 },
    back: { x: 0, y: 180, z: 0 },
    right: { x: 0, y: 90, z: 0 },
    left: { x: 0, y: -90, z: 0 },
    top: { x: 90, y: 0, z: 0 },
    bottom: { x: -90, y: 0, z: 0 },
  };

  const rotation = rotationMap[face];
  rotates.value[index] = { ...rotation, running: false };
}

// 修改骰子旋转样式计算
function getCubeStyle(index: number) {
  return {
    transform: `rotateX(${rotates.value[index].x}deg) 
              rotateY(${rotates.value[index].y}deg) 
              rotateZ(${rotates.value[index].z}deg)`,
  };
}

function handleClick() {
  if (!props.enable)
    return;
  emit('beforeRoll');
  roll();
}

// 获取指定面的点位置数组
function getFaceDotPositions(face: keyof typeof FACE_DOT_POSITIONS) {
  const currentNumber = face === 'front' ? results[0] : undefined;
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
      v-for="(_, index) in Array(props.number)"
      :key="index"
      class="dice"
      :class="{ rolling: rotates[index].running }"
      :style="{ width: `${size / 16}rem`, height: `${size / 16}rem` }"
      @click="handleClick"
    >
      <div class="dice-cube" :style="getCubeStyle(index)">
        <template v-for="face in ['front', 'back', 'right', 'left', 'top', 'bottom'] as const" :key="face">
          <div class="face" :class="face">
            <div
              v-for="position in getFaceDotPositions(face)"
              :key="position"
              class="dot"
              :class="position"
              :style="{ width: `${dotSize / 16}rem`, height: `${dotSize / 16}rem` }"
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
  perspective: 62.5rem;
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
  gap: calc(v-bind(dotSize) / 16 * 1rem);
  backface-visibility: visible;
  box-shadow: inset 0 0 0.9375rem rgba(0, 0, 0, 0.1);
}

.front {
  transform: rotateY(0deg) translateZ(calc(v-bind(size) / 32 * 1rem));
}

.back {
  transform: rotateY(180deg) translateZ(calc(v-bind(size) / 32 * 1rem));
}

.right {
  transform: rotateY(90deg) translateZ(calc(v-bind(size) / 32 * 1rem));
}

.left {
  transform: rotateY(-90deg) translateZ(calc(v-bind(size) / 32 * 1rem));
}

.top {
  transform: rotateX(90deg) translateZ(calc(v-bind(size) / 32 * 1rem));
}

.bottom {
  transform: rotateX(-90deg) translateZ(calc(v-bind(size) / 32 * 1rem));
}

.dot {
  position: absolute;
  background: #333;
  border-radius: 50%;
  grid-area: var(--position);
}

.center {
  top: calc(50% - v-bind(dotSize) / 32 * 1rem);
  left: calc(50% - v-bind(dotSize) / 32 * 1rem);
}

.top-left {
  top: calc(v-bind(size) * 0.1 / 16 * 1rem);
  left: calc(v-bind(size) * 0.1 / 16 * 1rem);
}

.top-right {
  top: calc(v-bind(size) * 0.1 / 16 * 1rem);
  right: calc(v-bind(size) * 0.1 / 16 * 1rem);
}

.center-left {
  top: calc(50% - v-bind(dotSize) / 32 * 1rem);
  left: calc(v-bind(size) * 0.1 / 16 * 1rem);
}

.center-right {
  top: calc(50% - v-bind(dotSize) / 32 * 1rem);
  right: calc(v-bind(size) * 0.1 / 16 * 1rem);
}

.bottom-left {
  bottom: calc(v-bind(size) * 0.1 / 16 * 1rem);
  left: calc(v-bind(size) * 0.1 / 16 * 1rem);
}

.bottom-right {
  bottom: calc(v-bind(size) * 0.1 / 16 * 1rem);
  right: calc(v-bind(size) * 0.1 / 16 * 1rem);
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
