/**
 * 需求:
 *
 * 实现客户端组网, 支持数据广播 (类似群聊)
 * 尽可能降低服务器压力, 尽可能保持组网网络稳定
 *
 * 业界方案:
 *
 * WebSocket 该方案可以通过房间的形式实现组网广播, 但是所有数据都会从服务器中转
 * WebRTC 该方案只在建立链接的时候与服务器存在数据交换, 后续所有消息都通过 RTC 链接点对点传输
 *
 * 技术选型:
 *
 * 采用 WebRTC 的方式实现客户端组网, 在服务器资源有限的情况下该技术能有效降低服务器负载
 * 但是存在稳定性问题 (后续可通过技术实现解决) 和无法穿透问题 (降级到 WebSocket 方法)
 *
 * WebRTC 组网架构分析:
 *
 * SFU 架构进入房间后只和房主建立链接, 普通用户之间不存在链接, 所有消息通过房主转发, 问题是房主离开后, 所有链接会断开
 * Mesh 架构进入房间时需要多人共同创建对等链接, 容易导致链接膨胀, 但是稳定性更好, 因为每个用户间都可以独立交流
 * MCU 架构进入房间时只需要和中转服务器建立链接, 不如直接使用 socket 通信, 想要降低服务器压力, 所以放弃该架构
 *
 * 技术方案:
 *
 * 当前项目使用 SFU 架构, 虽然存在房主离开, 所有链接断开的问题, 但是可以通过重新选举房主的机制来重连
 * 同时 SFU 架构后续通信直接绕过服务器, 可以有效降低服务器的压力
 * 除房主外的用户和服务的信令通道在 RTC 链接创建成功后自动关闭
 * 房主离开后, 其余用户重连信令服务器, 重新选举房主, 重新建立 RTC 链接
 * 房主重新选举时, 按进入顺序顺延
 * 所有用户退出房间或所有用户同意关闭房间时, 房间关闭
 *
 * 技术时序:
 *
 * 主逻辑链路:
 *
 * 1. 房主创建房间, 进入房间
 * 2. 用户申请进入房间
 * 3, 房主通过申请, 用户进入房间
 * 4. 用户与房主建立 RTC 链接
 * 5. 房主离开, 其余用户重新选举房主
 * 6. 所有用户退出房间/所有用户同意关闭房间, 房间关闭
 *
 * 信令交换逻辑:
 *
 * 1. 用户进入网页, 自动链接信令服务器进入世界频道
 * 2. 用户创建房间, 成为房主, 进入房间
 * 3. 用户申请进入房间, 信令服务器转发申请给房主
 * 4. 房主同意申请, 信令服务器转发申请给用户
 * 5. 用户进入房间, 创建 RTC 链接 (a 创建设置并发送 offer, b 创建设置并接受 offer, b 发送 answer, a 接受 answer)
 */
import type { TAnyFunc, TFunc, TObject, TOptional } from '@cmtlyt/base';
import { cacheReturnValue, getRandomString, noop } from '@cmtlyt/base';
import { pick_ } from '@cmtlyt/base/fp/utils';
import { decode, encode } from '@msgpack/msgpack';
import defu from 'defu';
// import { hash } from 'ohash';
import { createSocket } from './socket-adapter';

/** 处理接收数据 */
function receverdDataHandler(oriData: any) {
  if (!oriData)
    return {};
  return decode(oriData) as TObject<any>;
}

/** 处理发送数据 */
function sendDataHandler(oriData: TObject<any>) {
  return encode(oriData || {});
}

/** socekt 逻辑 */

/** 世界频道 */
const WORLD_ROOM = 'world';

// const SOCKET_URL = 'ws://localhost:8888';
const SOCKET_URL = `${location.protocol === 'https:' ? 'wss://' : 'ws://'}${location.host}/socket.io`;

interface JoinRoomOfferInfo {
  userId: string;
  roomId: string;
}

interface JoinRoomAnswerInfo {
  roomId: string;
  result: boolean;
}

interface ClientInfo {
  isRoomAdmin: boolean;
  userId: string;
  roomId: string;
}

export interface EventCenterAdapter {
  on: TFunc<[event: string, handler: TAnyFunc], any>;
  once: TFunc<[event: string, handler: TAnyFunc], any>;
  remove: TFunc<[event: string, handler: TAnyFunc], any>;
  emit: TFunc<[event: string, data: any], any>;
}

export interface SocketAdapter {
  on: TFunc<[event: string, handler: TAnyFunc], any>;
  off: TFunc<[event: string, handler?: TAnyFunc], any>;
  emit: TFunc<[event: string, data: any], any>;
}

export interface ClientOption {
  userId: string;
  eventCenter: EventCenterAdapter;
  generateRoomId: TFunc<[], string | Promise<string>>;
  onJoinRoomOffer: TFunc<[JoinRoomOfferInfo], boolean | Promise<boolean>>;
  onJoinRoomAnswer: TFunc<[JoinRoomAnswerInfo], any>;
}

interface Store extends ClientInfo, ClientOption {
  socket: SocketAdapter;
  rtcClients: RTCClient[];
}

/** 客户端信息 */
let store: Store = {
  isRoomAdmin: false,
  roomId: WORLD_ROOM,
  userId: '',
  socket: null as unknown as SocketAdapter,
  rtcClients: [],
  eventCenter: new EventCenter(),
  onJoinRoomOffer: noop,
  onJoinRoomAnswer: noop,
  generateRoomId: () => getRandomString(16),
};

/** socket 事件 */
enum SocketEventMap {
  joinRoom = 'joinRoom',
  // eslint-disable-next-line ts/no-duplicate-enum-values
  createRoom = 'joinRoom',
  leaveRoom = 'leaveRoom',
  joinRoomOffer = 'joinRoomOffer',
  joinRoomAnswer = 'joinRoomAnswer',
  offer = 'offer',
  answer = 'answer',
  candidate = 'candidate',
}

/** 广播事件 */
const broadcastEvents = [
  SocketEventMap.joinRoomOffer,
  SocketEventMap.joinRoomAnswer,
  SocketEventMap.offer,
  SocketEventMap.answer,
  SocketEventMap.candidate,
];

function signature(_payload: TObject<any>) {
  // 完整 payload 会在后端根据 operation 等参数进行转换所以只验证 data, userId, roomId 数据的准确性即可
  // TODO: 存在消息被劫持转发给他人或其他房间的可能
  // TODO: 测试阶段不进行数据签名, 后续完善后再进行数据签名
  // return hash(pick_(['data', 'userId'], payload));
  return '';
}

function getPayload(event: SocketEventMap, data?: TObject<any>, operation?: TObject<any>, encodeData = true) {
  const payload: TObject<any> = {
    roomId: store.roomId,
    userId: store.userId,
    data: encodeData ? sendDataHandler({ ...data, event }) : { ...data, event },
    operation,
  };
  payload.sign = signature({ ...payload, data: { ...data, event } });
  return payload;
}

/** 发送事件 */
function emit(event: SocketEventMap, data?: TObject<any>, operation?: TObject<any>, unpack = false) {
  if (!store.socket)
    return;
  const eventName = broadcastEvents.includes(event) ? 'broadcast' : event;
  store.socket.emit(eventName, unpack
    ? data
    : getPayload(event, data, operation));
}

/** 监听事件 */
function onEvent(event: SocketEventMap, handler: (data: any) => void, once?: boolean) {
  const eventName = broadcastEvents.includes(event) ? 'broadcast' : event;
  const callback = (oriPayload: TObject<any>) => {
    const { sign, ...otherPayload } = oriPayload;
    const payload: TObject<any> = {
      ...otherPayload,
      data: oriPayload.metadata?.unpack ? oriPayload.data : receverdDataHandler(oriPayload.data),
    };
    if (sign !== signature(payload))
      return;
    const {
      data: { event: absEvent },
    } = payload;
    if (absEvent !== event)
      return;
    if (once) {
      store.socket.off(eventName, callback);
    }
    handler(payload);
  };
  store.socket.on(eventName, callback);
}

/** 进入房间 */
function joinRoom(roomId: string, roomAdminId: string = '') {
  store.roomId = roomId;
  emit(SocketEventMap.joinRoom, { roomAdminId }, { sendSelfId: true });
}

/** 创建房间 (房主) */
async function createRoom() {
  store.isRoomAdmin = true;

  const roomId = await store.generateRoomId();

  joinRoom(roomId);

  // 房主需要持续监听入房申请
  onEvent(SocketEventMap.joinRoomOffer, joinRoomOfferHandler);
  // 用户加入房间后创建 RTC 链接
  onEvent(SocketEventMap.joinRoom, createRTC);

  return roomId;
}

/** 申请进入房间 (用户) */
function sendJoinRoomOffer(roomId: string) {
  emit(
    SocketEventMap.joinRoomOffer,
    {
      ...getPayload(SocketEventMap.joinRoomOffer, { roomId }, { sendSelfId: true }),
      roomId,
    },
    {},
    true,
  );
  // 只处理一次申请响应
  onEvent(
    SocketEventMap.joinRoomAnswer,
    ({ data: { roomId }, metadata: { from } }) => {
      store.onJoinRoomAnswer({ roomId, result: Boolean(roomId) });
      if (!roomId) {
        store.socket.off(SocketEventMap.joinRoom);
        return;
      }
      joinRoom(roomId, from);
    },
    true,
  );
  // 用户只处理一次入房事件
  onEvent(SocketEventMap.joinRoom, createRTC, true);
}

/** 处理申请进入房间请求 (房主) */
async function joinRoomOfferHandler({ userId, data: { roomId }, metadata: { from } }: TObject<any>) {
  // 如果不是房主所在的房间则直接绕过申请流程
  if (roomId !== store.roomId)
    return;
  if (await store.onJoinRoomOffer({ userId, roomId })) {
    // 同意
    emit(SocketEventMap.joinRoomAnswer, { roomId }, { onlySendTarget: from, sendSelfId: true });
  }
  else {
    // 拒绝
    emit(SocketEventMap.joinRoomAnswer, { roomId: null }, { onlySendTarget: from });
  }
}

/** RTC 逻辑 */

/** RTC 客户端类型 */
interface RTCClient {
  conn: RTCPeerConnection;
  dataChannel: RTCDataChannel;
}

/** 处理 RTC 通道消息 */
function channelMessageHandler(payload: TObject<any>) {
  const { event, data } = payload;
  store.eventCenter.emit(event, data);
}

/** 初始化 RTC 通道监听 */
function initDataChannelListener(channel: RTCDataChannel) {
  channel.onmessage = ({ data: payload }) => {
    const data = receverdDataHandler(payload);
    channelMessageHandler(data);
    if (store.isRoomAdmin) {
      sendData(data);
    }
  };
}

/** 创建 RTC 链接 */
function createRTC({ userId, metadata: { from }, data: { roomAdminId } }: TObject<any>) {
  // 房主入房不需要创建 RTC 链接
  if (userId === store.userId && store.isRoomAdmin)
    return;
  const conn = new RTCPeerConnection({
    iceServers: [{ urls: ['stun:74.125.250.129:19302', 'stun:stun.l.google.com:19302'] }],
    iceTransportPolicy: 'all',
    iceCandidatePoolSize: 10,
  });
  const channel = conn.createDataChannel(userId);
  initDataChannelListener(channel);
  const rtcClient = {
    conn,
    dataChannel: channel,
  };
  store.rtcClients.push(rtcClient);
  // 监听 RTC 链接 ice candidate 变化
  onEvent(SocketEventMap.candidate, async ({ data: { candidate } }) => {
    conn.addIceCandidate(new RTCIceCandidate(candidate)).catch(noop);
  });
  conn.onicecandidate = (event) => {
    if (event.candidate) {
      emit(
        SocketEventMap.candidate,
        { candidate: event.candidate.toJSON() },
        { onlySendTarget: store.isRoomAdmin ? from : roomAdminId },
      );
    }
  };
  if (store.isRoomAdmin) {
    // 房主接收 offer
    onEvent(
      SocketEventMap.offer,
      async ({ data: { offer }, metadata: { from } }) => {
        await conn.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await conn.createAnswer();
        await conn.setLocalDescription(answer);
        emit(SocketEventMap.answer, { answer: conn.localDescription!.toJSON() }, { onlySendTarget: from });
      },
      true,
    );
  }
  else {
    // 用户接收 answer
    onEvent(
      SocketEventMap.answer,
      async ({ data: { answer } }) => {
        await conn.setRemoteDescription(new RTCSessionDescription(answer));
      },
      true,
    );
  }
  // 本地 offer 双方都需要
  conn.onnegotiationneeded = async () => {
    const offer = await conn.createOffer();
    await conn.setLocalDescription(offer);
    if (!store.isRoomAdmin) {
      emit(
        SocketEventMap.offer,
        { offer: conn.localDescription!.toJSON() },
        { sendSelfIf: true, onlySendTarget: roomAdminId },
      );
    }
  };
  // 获取最终的 channel 通道
  conn.ondatachannel = (event) => {
    const channel = (rtcClient.dataChannel = event.channel);
    initDataChannelListener(channel);
  };
}

/** 使用 RTC 链接传递数据 */
function sendData(userData: TObject<any>, isSelf?: boolean) {
  const data = sendDataHandler(userData);
  if (store.isRoomAdmin && isSelf)
    channelMessageHandler(userData);
  store.rtcClients.forEach(({ dataChannel }) => dataChannel.readyState === 'open' && dataChannel.send(data));
}

/** 更新客户端信息 */
function updateStore(info: Partial<Store>) {
  store = defu(info, store);
}

/** 发送 RTC 事件 */
function rtcEmit(event: string, data: any) {
  sendData({ event, data }, true);
}

export interface RTCControllerInstance extends EventCenterAdapter {
  /** 客户端信息 */
  clientInfo: ClientInfo;
  /** 创建房间 */
  createRoom: typeof createRoom;
  /** 申请进入房间 */
  sendJoinRoomOffer: typeof sendJoinRoomOffer;
}

/**
 * 获取 RTC 控制器
 * 全局单例
 */
export const getRTCController = cacheReturnValue((
  option: TOptional<ClientOption, 'eventCenter' | 'generateRoomId'>,
): RTCControllerInstance => {
  /** 创建 socekt 链接 */
  const socket = createSocket(SOCKET_URL);
  /** 进入世界频道 */
  joinRoom(WORLD_ROOM);

  updateStore({ ...option, socket });

  const { eventCenter } = store;

  return {
    get clientInfo() {
      return pick_(['isRoomAdmin', 'roomId', 'userId'], store);
    },
    createRoom,
    sendJoinRoomOffer,
    emit: rtcEmit,
    on: eventCenter.on.bind(eventCenter),
    remove: eventCenter.remove.bind(eventCenter),
    once: eventCenter.once.bind(eventCenter),
  };
});
