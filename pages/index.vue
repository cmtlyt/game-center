<script setup lang="ts">
import type { RTCControllerInstance } from '@/utils/rtc-controller';

const rtcRef = shallowRef() as Ref<RTCControllerInstance | null>;
const messages = reactive<string[]>([]);

if (import.meta.client) {
  const { getRTCController } = await import('@/utils/rtc-controller');
  const rtc = rtcRef.value = getRTCController({
    userId: await getFingerprint(),
    onJoinRoomAnswer({ result }) {
      if (!result)
        // eslint-disable-next-line no-alert
        alert('加入房间失败');
    },
    onJoinRoomOffer({ roomId, userId }) {
      // eslint-disable-next-line no-alert
      return confirm(`${userId} 请求加入房间 ${roomId}`);
    },
  });

  rtc.on('message', (data) => {
    messages.push(JSON.stringify(data));
  });
}

function sendMessage() {
  rtcRef.value?.emit('message', rtcRef.value?.clientInfo);
}

async function createRoom() {
  console.debug(await rtcRef.value?.createRoom());
}

function joinRoom() {
  // @ts-expect-error test
  rtcRef.value?.sendJoinRoomOffer(window.roomId);
}

const { changeStatus, gameState, next } = useMahjong(4);

// 添加所有可能的游戏状态
const gameStatuses = [
  { label: '游戏开始', value: 'init' },
  { label: '确定庄家', value: 'determineDealer' },
  { label: '庄家平局重掷', value: 'dealerRollTie' },
  { label: '第一次投掷', value: 'firstRoll' },
  { label: '第二次投掷', value: 'secondRoll' },
  { label: '游戏进行中', value: 'playing' },
  { label: '游戏结束', value: 'finished' },
] as const;
</script>

<template>
  <div>
    <ul>
      <li v-for="msg, idx in messages" :key="idx">
        {{ msg }}
      </li>
    </ul>
    <button @click="createRoom">
      创建房间
    </button>
    <button @click="joinRoom">
      加入房间
    </button>
    <button @click="sendMessage">
      发送消息
    </button>

    <!-- 添加游戏状态显示和切换控制 -->
    <div class="game-status-control">
      <h3>当前游戏状态: {{ gameState.status }}</h3>
      <div class="status-buttons">
        <button
          v-for="status in gameStatuses" :key="status.value" :class="{ active: gameState.status === status.value }"
          @click="changeStatus(status.value)"
        >
          {{ status.label }}
        </button>
      </div>
      <button @click="next">
        执行操作
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.game-status-control {
  margin-top: 20px;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;

  h3 {
    margin-bottom: 12px;
  }
}

.status-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  button {
    padding: 8px 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;

    &:hover {
      background: #f5f5f5;
    }

    &.active {
      background: #e6f7ff;
      border-color: #1890ff;
      color: #1890ff;
    }
  }
}
</style>
