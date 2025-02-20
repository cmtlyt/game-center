<script setup lang="ts">
/**
 * 骰子组件
 * 功能：点击骰子返回数字
 */

interface Props {
  size?: number; // 骰子大小
  enable?: boolean; // 是否可点击进行投掷
  groupMode?: boolean; // 是否为组合模式
  onFinish?: (result: number) => void; // 动画结束后的回调
  onBeforeRoll?: () => void; // 动画开始前的回调
}

const props = withDefaults(defineProps<Props>(), {
  enable: true,
  size: 100,
  groupMode: false,
});

const result = ref(1);
const isRolling = ref(false);
const rotateX = ref(0);
const rotateY = ref(0);
const isHovering = ref(false);
const animationStartTime = ref(0);
const ANIMATION_DURATION = 1000; // 动画持续时间（毫秒）

function roll() {
  if (isRolling.value)
    return;

  isRolling.value = true;
  animationStartTime.value = performance.now();

  function animate(currentTime: number) {
    const elapsed = currentTime - animationStartTime.value;

    if (elapsed < ANIMATION_DURATION) {
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
      props.onFinish?.(result.value);
    }
  }

  requestAnimationFrame(animate);
}

const diceStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}));

const dotSize = computed(() => props.size * 0.2);
const dotStyle = computed(() => ({
  width: `${dotSize.value}px`,
  height: `${dotSize.value}px`,
}));

const cubeStyle = computed(() => ({
  transform: isHovering.value
    ? `rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg)`
    : 'rotateX(0deg) rotateY(0deg)',
}));

function handleClick() {
  // 在组合模式下，只触发 onBeforeRoll
  if (props.groupMode) {
    props.onBeforeRoll?.();
    return;
  }

  // 单独模式下，直接执行投掷
  if (props.enable) {
    props.onBeforeRoll?.();
    roll();
  }
}

defineExpose({
  roll,
});
</script>

<template>
  <div
    class="dice"
    :class="{ rolling: isRolling }"
    :style="diceStyle"
    @click="handleClick"
  >
    <div class="dice-cube" :style="cubeStyle">
      <div class="face front">
        <template v-if="result === 1">
          <div class="dot center" :style="dotStyle" />
        </template>

        <template v-else-if="result === 2">
          <div class="dot top-right" :style="dotStyle" />
          <div class="dot bottom-left" :style="dotStyle" />
        </template>

        <template v-else-if="result === 3">
          <div class="dot top-right" :style="dotStyle" />
          <div class="dot center" :style="dotStyle" />
          <div class="dot bottom-left" :style="dotStyle" />
        </template>

        <template v-else-if="result === 4">
          <div class="dot top-left" :style="dotStyle" />
          <div class="dot top-right" :style="dotStyle" />
          <div class="dot bottom-left" :style="dotStyle" />
          <div class="dot bottom-right" :style="dotStyle" />
        </template>

        <template v-else-if="result === 5">
          <div class="dot top-left" :style="dotStyle" />
          <div class="dot top-right" :style="dotStyle" />
          <div class="dot center" :style="dotStyle" />
          <div class="dot bottom-left" :style="dotStyle" />
          <div class="dot bottom-right" :style="dotStyle" />
        </template>

        <template v-else-if="result === 6">
          <div class="dot top-left" :style="dotStyle" />
          <div class="dot top-right" :style="dotStyle" />
          <div class="dot center-left" :style="dotStyle" />
          <div class="dot center-right" :style="dotStyle" />
          <div class="dot bottom-left" :style="dotStyle" />
          <div class="dot bottom-right" :style="dotStyle" />
        </template>
      </div>
      <div class="face back">
        <div class="dot top-left" :style="dotStyle" />
        <div class="dot top-right" :style="dotStyle" />
        <div class="dot center-left" :style="dotStyle" />
        <div class="dot center-right" :style="dotStyle" />
        <div class="dot bottom-left" :style="dotStyle" />
        <div class="dot bottom-right" :style="dotStyle" />
      </div>
      <div class="face right">
        <div class="dot top-left" :style="dotStyle" />
        <div class="dot top-right" :style="dotStyle" />
        <div class="dot center" :style="dotStyle" />
        <div class="dot bottom-left" :style="dotStyle" />
        <div class="dot bottom-right" :style="dotStyle" />
      </div>
      <div class="face left">
        <div class="dot top-right" :style="dotStyle" />
        <div class="dot center" :style="dotStyle" />
        <div class="dot bottom-left" :style="dotStyle" />
      </div>
      <div class="face top">
        <div class="dot top-right" :style="dotStyle" />
        <div class="dot bottom-left" :style="dotStyle" />
      </div>
      <div class="face bottom">
        <div class="dot center" :style="dotStyle" />
      </div>
    </div>
  </div>
</template>

<style scoped lang='less'>
.dice {
  perspective: 1000px;
  cursor: pointer;

  &-cube {
    width: 100%;
    height: 100%;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.3s ease-out;
  }

  &.rolling .dice-cube {
    animation: rolling 2s ease-in-out;
  }
}

.face {
  position: absolute;
  width: 100%;
  height: 100%;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 10%;
  display: flex;
  justify-content: center;
  align-items: center;
  backface-visibility: visible;
  box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.1);
}

.front {
  transform: rotateY(0deg) translateZ(calc(v-bind(size) / 2 * 1px));
}
.back {
  transform: rotateY(180deg) translateZ(calc(v-bind(size) / 2 * 1px));
}
.right {
  transform: rotateY(90deg) translateZ(calc(v-bind(size) / 2 * 1px));
}
.left {
  transform: rotateY(-90deg) translateZ(calc(v-bind(size) / 2 * 1px));
}
.top {
  transform: rotateX(90deg) translateZ(calc(v-bind(size) / 2 * 1px));
}
.bottom {
  transform: rotateX(-90deg) translateZ(calc(v-bind(size) / 2 * 1px));
}

.dot {
  position: absolute;
  background: #333;
  border-radius: 50%;
}

.center {
  top: calc(50% - v-bind(dotSize) / 2 * 1px);
  left: calc(50% - v-bind(dotSize) / 2 * 1px);
}
.top-left {
  top: calc(v-bind(size) * 0.1 * 1px);
  left: calc(v-bind(size) * 0.1 * 1px);
}
.top-right {
  top: calc(v-bind(size) * 0.1 * 1px);
  right: calc(v-bind(size) * 0.1 * 1px);
}
.center-left {
  top: calc(50% - v-bind(dotSize) / 2 * 1px);
  left: calc(v-bind(size) * 0.1 * 1px);
}
.center-right {
  top: calc(50% - v-bind(dotSize) / 2 * 1px);
  right: calc(v-bind(size) * 0.1 * 1px);
}
.bottom-left {
  bottom: calc(v-bind(size) * 0.1 * 1px);
  left: calc(v-bind(size) * 0.1 * 1px);
}
.bottom-right {
  bottom: calc(v-bind(size) * 0.1 * 1px);
  right: calc(v-bind(size) * 0.1 * 1px);
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
