/* eslint-disable no-console */
import type { TArgsType, TRequired } from '@cmtlyt/base';
import type { Kind, Logger, LoggerOptions } from '@cmtlyt/logger';
import { noop } from '@cmtlyt/base';
import { createLogger } from '@cmtlyt/logger';

type ExtendsKind = 'appear' | 'event';

interface MonitorStore {
  needReportKind: (Kind | ExtendsKind)[];
}

interface ExtendsOption {
  store: MonitorStore;
}

type ExtendedLoggerOptions = LoggerOptions<ExtendsKind, ExtendsOption>;

type LogEvent = TArgsType<TRequired<ExtendedLoggerOptions>['onLogBefore']>[0];

interface ReportInfo {
  spm: string;
  kind: string;
  event?: string;
  data: unknown[];
}

type LoggerInstance = Logger & {
  appear: (spm: string, data: unknown) => void;
  event: (spm: string, event: string, data: unknown) => void;
  error: (spm: string, data: unknown) => void;
};

/** 日志上报策略 */
function reportStategy(this: ExtendedLoggerOptions, event: LogEvent) {
  const { kind } = event;
  if (!this.store.needReportKind.includes(kind) || !import.meta.client) {
    return false;
  }
  return true;
}

/** 格式化 spm */
function formatSpm(spm: string) {
  const spmSplit = spm.split('.').filter(Boolean);
  if (spmSplit.length < 2)
    throw new SyntaxError(`SPM ${spm} is invalid`);
  const pageName = location.pathname.split('/').pop() || 'index';
  const defaultSpm = [pageName, ...spmSplit];
  return `spartan-scheduler.${defaultSpm.slice(defaultSpm.length - 3).join('.')}`;
}

/** 格式化日志信息 */
function formatReportInfo(this: ExtendedLoggerOptions, event: LogEvent): ReportInfo {
  const { kind, messages } = event;
  const [spm, eventName, data] = messages as any[];
  return {
    spm: formatSpm(spm),
    kind,
    event: kind === 'event' ? eventName : undefined,
    data: data || eventName,
  };
}

const oriInfo = console.info.bind(console);
const oriDebug = console.debug.bind(console);

/** 日志上报 */
function report(this: ExtendedLoggerOptions, info: ReportInfo) {
  console.groupCollapsed(info.kind, info.spm);
  oriInfo(info);
  console.groupEnd();
}

export const logger: LoggerInstance = createLogger<ExtendsKind, ExtendsOption>({
  store: {
    needReportKind: ['appear', 'event', 'error'],
  },
  onLogBefore(event) {
    // 日志上报策略
    if (!reportStategy.call(this, event))
      return;
    // 格式化日志信息
    const reportInfo = formatReportInfo.call(this, event);
    report.call(this, reportInfo);
  },
  getPrintFunc() {
    if (import.meta.client && import.meta.dev) {
      return oriDebug;
    }
    return noop;
  },
  logConfig: {
    appear: { kind: 'appear', inherit: 'info', needTrace: true },
    event: { kind: 'event', inherit: 'info', needTrace: true },
    error: { kind: 'error', needTrace: true },
  },
});

console.log = logger.info;
console.info = logger.info;
