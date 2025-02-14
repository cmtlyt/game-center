import type { TAnyFunc, TObject } from '@cmtlyt/base';

const instanceMap = new Map<string, EventCenter>();

export class EventCenter {
  private handlerMap: TObject<TAnyFunc[]> = {};

  constructor(token: string = 'global') {
    if (!instanceMap.has(token)) {
      instanceMap.set(token, this);
    }
    return instanceMap.get(token)!;
  }

  on(eventName: string, cb: TAnyFunc) {
    if (!this.handlerMap[eventName]) {
      this.handlerMap[eventName] = [];
    }
    this.handlerMap[eventName].push(cb);
  }

  emit(eventName: string, ...args: any[]) {
    if (this.handlerMap[eventName]) {
      this.handlerMap[eventName].forEach(cb => cb(...args));
    }
  }

  once(eventName: string, cb: TAnyFunc) {
    const wrapper = (...args: any[]) => {
      cb(...args);
      this.remove(eventName, wrapper);
    };
    this.on(eventName, wrapper);
  }

  remove(eventName: string, cb: TAnyFunc) {
    if (this.handlerMap[eventName]) {
      this.handlerMap[eventName] = this.handlerMap[eventName].filter(c => c !== cb);
    }
  }

  clear(eventName: string) {
    this.handlerMap[eventName] = [];
  }
}
