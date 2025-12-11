import { GMitt, InjectedScriptBridge, MessageType } from "@/utils";

export class BaseCtrl extends GMitt {
  protected _bridge: InjectedScriptBridge;
  protected _type: MessageType;
  
  constructor(type: MessageType, bridge: InjectedScriptBridge) {
    super();
    this._bridge = bridge;
    this._type = type;
    this._init();
  }

  public sendDevToolData(data: any) {
    this._bridge.postToDevTool(this._type, data)
  }

  protected _init() {

  }

  /**
   * 序列化执行结果（处理不可序列化的对象）
   */
  public serializeResult(result: any): any {
    if (result === undefined) return 'undefined';
    if (result === null) return null;
    if (typeof result === 'function') return result.toString();
    if (result instanceof Error) return { error: result.message, stack: result.stack };
    
    // 对于 DOM 元素，返回简化信息
    if (result instanceof Element) {
      return {
        tagName: result.tagName,
        id: result.id,
        className: result.className,
        textContent: result.textContent?.substring(0, 100),
      };
    }

    // 对于对象和数组，尝试 JSON 序列化
    try {
      JSON.stringify(result);
      return result;
    } catch {
      return String(result);
    }
  }
}
