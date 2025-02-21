<script setup lang="ts">
/**
 * 骰子组件
 * 功能：点击骰子返回数字
 */

interface Props {
  size?: number; // 骰子大小
  enable?: boolean; // 是否可点击进行投掷
  groupMode?: boolean; // 是否为组合模式
  duration?: number; // 动画持续时间
  onFinish?: (result: number) => void; // 动画结束后的回调
  onBeforeRoll?: () => void; // 动画开始前的回调
}

const props = withDefaults(defineProps<Props>(), {
  enable: true,
  size: 100,
  groupMode: false,
  duration: 1000,
});

const emit = defineEmits<{
  finish: [result: number];
}>();

// 骰子当前显示的点数（1-6）
const result = ref(1);
// 是否正在进行投掷动画
const isRolling = ref(false);
// 骰子旋转角度
const rotate = reactive({
  x: 0, // 在 X 轴上的旋转角度
  y: 0, // 在 Y 轴上的旋转角度
});
// 是否正在悬停在骰子上
const isHovering = ref(false);
// 动画开始的时间戳
const animationStartTime = ref(0);

// 骰子各个点数对应的点位置
const DOT_POSITIONS = {
  1: ['center'],
  2: ['top-right', 'bottom-left'],
  3: ['top-right', 'center', 'bottom-left'],
  4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
  6: ['top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right'],
} as const;

// 骰子所有面的点位
const FACE_DOT_POSITIONS = {
  front: (result: number) => DOT_POSITIONS[result as keyof typeof DOT_POSITIONS] || [],
  back: ['top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right'],
  right: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
  left: ['top-right', 'center', 'bottom-left'],
  top: ['top-right', 'bottom-left'],
  bottom: ['center'],
} as const;

function roll() {
  if (isRolling.value)
    return;

  isRolling.value = true;
  animationStartTime.value = performance.now();

  function animate(currentTime: number) {
    const elapsed = currentTime - animationStartTime.value;

    if (elapsed < props.duration) {
      // 在动画期间快速更新骰子点数
      if (elapsed % 50 < 16) { // 约每50ms更新一次数字
        result.value = Math.floor(Math.random() * 6) + 1;
      }
      requestAnimationFrame(animate);
    }
    else {
      // 动画结束
      result.value = Math.floor(Math.random() * 6) + 1;
      isRolling.value = false;
      emit('finish', result.value);
    }
  }

  requestAnimationFrame(animate);
}

// 修改骰子大小计算方式
const dotSize = props.size * 0.15; // 将点的大小比例从 0.2 调整为 0.15，使其在不同尺寸下更协调

// 骰子旋转样式
const cubeStyle = computed(() => ({
  transform: isHovering.value
    ? `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`
    : 'rotateX(0deg) rotateY(0deg)',
}));

function handleClick() {
  // 在组合模式下，只触发 onBeforeRoll
  if (props.groupMode) {
    props.onBeforeRoll?.();
    return;
  }

  // 单独模式下，直接执行投掷
  if (!props.enable)
    return;
  props.onBeforeRoll?.();
  roll();
}

// 获取指定面的点位置数组
function getFaceDotPositions(face: keyof typeof FACE_DOT_POSITIONS, result?: number) {
  const positions = FACE_DOT_POSITIONS[face];
  return typeof positions === 'function' ? positions(result!) : positions;
}

defineExpose({
  roll,
});
</script>

<template>
  <div
    class="dice"
    :class="{ rolling: isRolling }"
    :style="{ width: `${size / 16}rem`, height: `${size / 16}rem` }"
    @click="handleClick"
  >
    <div class="dice-cube" :style="cubeStyle">
      <template v-for="face in ['front', 'back', 'right', 'left', 'top', 'bottom'] as const" :key="face">
        <div class="face" :class="[face]">
          <div
            v-for="position in getFaceDotPositions(face, face === 'front' ? result : undefined)"
            :key="position"
            class="dot"
            :class="position"
            :style="{ width: `${dotSize / 16}rem`, height: `${dotSize / 16}rem` }"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dice {
  perspective: 62.5rem; // 1000px -> 62.5rem
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
  grid-area: var(--position); /* 通过 CSS 变量控制位置 */
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
