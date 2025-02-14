import type { TAnyFunc } from '@cmtlyt/base';
import type { Hookable } from 'hookable';
import { createHooks } from 'hookable';

const instanceMap = new Map<string, EventCenter>();

export class EventCenter {
  private hooks: Hookable;

  constructor(token: string = 'global') {
    this.hooks = createHooks();
    if (!instanceMap.has(token)) {
      instanceMap.set(token, this);
    }
    return instanceMap.get(token)!;
  }

  on(eventName: string, cb: TAnyFunc) {
    this.hooks.hook(eventName, cb);
  }

  emit(eventName: string, ...args: any[]) {
    this.hooks.callHook(eventName, ...args);
  }

  remove(eventName: string, cb: TAnyFunc) {
    this.hooks.removeHook(eventName, cb);
  }

  once(eventName: string, cb: TAnyFunc) {
    this.hooks.hookOnce(eventName, cb);
  }
}
