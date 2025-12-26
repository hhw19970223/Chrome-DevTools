/**
 * 工具类统一导出
 */

export * from './logger';
export * from './message';
export * from './message-types';
export * from './storage';
export * from './tabs';
export * from './dom';
export * from './bridge';
export * from './devtools-bridge';

export function createReactive(data: any, onChange: (info: {type: 'add' | 'set' | 'delete', path: string, oldValue: any, newValue: any}) => void, keys: string[]) {
  const proxyCache = new WeakMap();
  let paused = false;

  function buildPath(parentPath: string, key: string) {
    if (parentPath === "") return String(key);
    return `${parentPath}.${String(key)}`;
  }

  function wrap(target: any, path = "", keys: string[] = []) {
    if (target === null || typeof target !== "object") {
      return target;
    }

    if (proxyCache.has(target)) {
      return proxyCache.get(target);
    }

    const proxy = new Proxy(target, {
      get(t, key, receiver) {
        const value = Reflect.get(t, key, receiver);

        if (value && typeof value === "object" && keys.includes(key as string)) {
          return wrap(value, buildPath(path, key as string), keys);
        }

        return value;
      },

      set(t, key, value, receiver) {
        const oldValue = t[key];
        const newPath = buildPath(path, key as string);

        const result = Reflect.set(t, key, value, receiver);

        // 自动代理新增对象
        if (value && typeof value === "object" && keys.includes(key as string)) {
          Reflect.set(t, key, wrap(value, newPath, keys), receiver);
        }

        if (!paused && oldValue !== value) {
          onChange({
            type: oldValue === undefined ? "add" : "set",
            path: newPath,
            oldValue,
            newValue: value
          });
        }

        return result;
      },

      deleteProperty(t, key) {
        const existed = Object.prototype.hasOwnProperty.call(t, key);
        const oldValue = t[key];
        const newPath = buildPath(path, key as string);

        const result = Reflect.deleteProperty(t, key);

        if (!paused && existed) {
          onChange({
            type: "delete",
            path: newPath,
            oldValue,
            newValue: undefined
          });
        }

        return result;
      }
    });

    proxyCache.set(target, proxy);
    return proxy;
  }

  const rootProxy = wrap(data, "", keys);

  return {
    data: rootProxy,
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    }
  };
}
