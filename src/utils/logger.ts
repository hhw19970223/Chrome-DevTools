/**
 * 日志工具类 - 美化的Console输出
 */

type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

export class LogUtil {
  private static readonly PREFIX = '[DevTools Extension]';
  
  private static readonly STYLES: Record<LogLevel, string> = {
    info: 'color: #3b82f6; font-weight: bold;',
    success: 'color: #10b981; font-weight: bold;',
    warning: 'color: #f59e0b; font-weight: bold;',
    error: 'color: #ef4444; font-weight: bold;',
    debug: 'color: #8b5cf6; font-weight: bold;',
  };

  private static log(level: LogLevel, ...args: any[]): void {
    const style = this.STYLES[level];
    console.log(`%c${this.PREFIX} [${level.toUpperCase()}]`, style, ...args);
  }

  static info(...args: any[]): void {
    this.log('info', ...args);
  }

  static success(...args: any[]): void {
    this.log('success', ...args);
  }

  static warning(...args: any[]): void {
    this.log('warning', ...args);
  }

  static error(...args: any[]): void {
    this.log('error', ...args);
  }

  static debug(...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', ...args);
    }
  }

  /**
   * 分组日志
   */
  static group(label: string, collapsed: boolean = false): void {
    if (collapsed) {
      console.groupCollapsed(`${this.PREFIX} ${label}`);
    } else {
      console.group(`${this.PREFIX} ${label}`);
    }
  }

  static groupEnd(): void {
    console.groupEnd();
  }

  /**
   * 计时
   */
  static time(label: string): void {
    console.time(`${this.PREFIX} ${label}`);
  }

  static timeEnd(label: string): void {
    console.timeEnd(`${this.PREFIX} ${label}`);
  }

  /**
   * 表格输出
   */
  static table(data: any): void {
    console.log(`%c${this.PREFIX}`, this.STYLES.info);
    console.table(data);
  }
}

// 导出单例实例
export const logger = {
  info: (...args: any[]) => LogUtil.info(...args),
  success: (...args: any[]) => LogUtil.success(...args),
  warn: (...args: any[]) => LogUtil.warning(...args),
  error: (...args: any[]) => LogUtil.error(...args),
  debug: (...args: any[]) => LogUtil.debug(...args),
  group: (label: string, collapsed?: boolean) => LogUtil.group(label, collapsed),
  groupEnd: () => LogUtil.groupEnd(),
  time: (label: string) => LogUtil.time(label),
  timeEnd: (label: string) => LogUtil.timeEnd(label),
  table: (data: any) => LogUtil.table(data),
};


