/**
 * DOM 操作工具类
 */

export class DOMUtil {
  /**
   * 查询元素
   */
  static querySelector<T extends Element = Element>(selector: string): T | null {
    return document.querySelector<T>(selector);
  }

  /**
   * 查询所有元素
   */
  static querySelectorAll<T extends Element = Element>(selector: string): NodeListOf<T> {
    return document.querySelectorAll<T>(selector);
  }

  /**
   * 创建元素
   */
  static createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options?: {
      className?: string;
      id?: string;
      textContent?: string;
      attributes?: Record<string, string>;
      styles?: Partial<CSSStyleDeclaration>;
    }
  ): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName);

    if (options) {
      if (options.className) element.className = options.className;
      if (options.id) element.id = options.id;
      if (options.textContent) element.textContent = options.textContent;
      
      if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }

      if (options.styles) {
        Object.assign(element.style, options.styles);
      }
    }

    return element;
  }

  /**
   * 添加类名
   */
  static addClass(element: Element, ...classNames: string[]): void {
    element.classList.add(...classNames);
  }

  /**
   * 移除类名
   */
  static removeClass(element: Element, ...classNames: string[]): void {
    element.classList.remove(...classNames);
  }

  /**
   * 切换类名
   */
  static toggleClass(element: Element, className: string, force?: boolean): boolean {
    return element.classList.toggle(className, force);
  }

  /**
   * 检查是否包含类名
   */
  static hasClass(element: Element, className: string): boolean {
    return element.classList.contains(className);
  }

  /**
   * 设置属性
   */
  static setAttribute(element: Element, name: string, value: string): void {
    element.setAttribute(name, value);
  }

  /**
   * 获取属性
   */
  static getAttribute(element: Element, name: string): string | null {
    return element.getAttribute(name);
  }

  /**
   * 移除属性
   */
  static removeAttribute(element: Element, name: string): void {
    element.removeAttribute(name);
  }

  /**
   * 添加事件监听
   */
  static addEventListener<K extends keyof HTMLElementEventMap>(
    element: Element,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void {
    element.addEventListener(type, listener as EventListener, options);
  }

  /**
   * 移除事件监听
   */
  static removeEventListener<K extends keyof HTMLElementEventMap>(
    element: Element,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void {
    element.removeEventListener(type, listener as EventListener, options);
  }

  /**
   * 获取元素位置和尺寸
   */
  static getBoundingRect(element: Element): DOMRect {
    return element.getBoundingClientRect();
  }

  /**
   * 滚动到元素
   */
  static scrollIntoView(element: Element, options?: ScrollIntoViewOptions): void {
    element.scrollIntoView(options);
  }

  /**
   * 检查元素是否在视口中
   */
  static isInViewport(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * 获取元素的计算样式
   */
  static getComputedStyle(element: Element): CSSStyleDeclaration {
    return window.getComputedStyle(element);
  }

  /**
   * 等待元素出现
   */
  static waitForElement(
    selector: string,
    timeout: number = 5000
  ): Promise<Element> {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * 插入 HTML
   */
  static insertHTML(
    element: Element,
    position: InsertPosition,
    html: string
  ): void {
    element.insertAdjacentHTML(position, html);
  }

  /**
   * 移除元素
   */
  static remove(element: Element): void {
    element.remove();
  }

  /**
   * 清空元素内容
   */
  static empty(element: Element): void {
    element.innerHTML = '';
  }
}
