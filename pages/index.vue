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
  // eslint-disable-next-line no-console
  console.debug(await rtcRef.value?.createRoom());
}

function joinRoom() {
  // @ts-expect-error test
  rtcRef.value?.sendJoinRoomOffer(window.roomId);
}

const diceResult = ref<number[]>([]);
function handleDiceResult(result: number[]) {
  diceResult.value = result;
}
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
  </div>
  投掷结果：{{ diceResult }}

  <h2>骰子组合</h2>
  <div>
    <Dice :size="10" :count="3" :column="2" :gap="10" @finish="handleDiceResult" />
  </div>
  <h2>单个骰子</h2>
  <div>
    <Dice @finish="handleDiceResult" />
  </div>
</template>

<style lang="scss" scoped></style>
