import type { TAnyFunc } from '@cmtlyt/base';
import { decode } from '@msgpack/msgpack';
// import { io } from 'socket.io-client';

export function createSocket(url: string): SocketAdapter {
  // return io(url);
  const socket = new WebSocket(url);
  const eventCenter = new EventCenter();

  const on = (event: string, handler: TAnyFunc) => {
    eventCenter.on(event, handler);
  };

  const off = (event: string, handler?: TAnyFunc) => {
    if (!handler) {
      eventCenter.clear(event);
      return;
    }
    eventCenter.remove(event, handler);
  };

  const emit = (event: string, payload: any) => {
    const data = JSON.parse(JSON.stringify(payload.data));
    data.length = payload.data.length;
    payload.data = data;
    socket.send(JSON.stringify({ event, payload }));
  };

  /** 处理接收数据 */
  const receverdDataHandler = (oriData: any) => {
    if (!oriData)
      return {};
    return decode(oriData) as any;
  };

  socket.onmessage = async ({ data: payload }) => {
    const temp = JSON.parse(typeof payload === 'string' ? payload : await payload.text());
    const { event, data, ...other } = temp;
    const result = { ...other, data: receverdDataHandler(data) };
    result.metadata = { ...result.metadata, unpack: true };
    eventCenter.emit(event, result);
  };

  return { on, off, emit };
}
