import { useState, useEffect, useCallback } from 'react';
import { StorageUtil } from '@/utils/storage';

// 定义登录信息类型
export interface LoginInfo {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  [key: string]: any;
}

export interface CursorUser {
  email: string;
  name?: string;
  id?: string;
  [key: string]: any;
}

export interface LoginState {
  loginInfo: LoginInfo | null;
  cookie: string;
  cursorUser: CursorUser | null;
  email: string;
}

// Storage 键名
const STORAGE_KEYS = {
  LOGIN_INFO: 'cursor_login_info',
  COOKIE: 'cursor_cookie',
  CURSOR_USER: 'cursor_user',
  EMAIL: 'cursor_email',
} as const;

/**
 * 使用 Chrome Storage 的登录状态管理 Hook
 */
export function useLoginStore() {
  const [state, setState] = useState<LoginState>({
    loginInfo: null,
    cookie: '',
    cursorUser: null,
    email: '',
  });

  // 初始化：从 Chrome Storage 加载数据
  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const [loginInfo, cookie, cursorUser, email] = await Promise.all([
          StorageUtil.get<LoginInfo>(STORAGE_KEYS.LOGIN_INFO),
          StorageUtil.get<string>(STORAGE_KEYS.COOKIE),
          StorageUtil.get<CursorUser>(STORAGE_KEYS.CURSOR_USER),
          StorageUtil.get<string>(STORAGE_KEYS.EMAIL),
        ]);

        setState({
          loginInfo: loginInfo || null,
          cookie: cookie || '',
          cursorUser: cursorUser || null,
          email: email || '',
        });
      } catch (error) {
        console.error('Failed to load from storage:', error);
      }
    };

    loadFromStorage();

    // 监听 Storage 变化
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const newState: Partial<LoginState> = {};
      let hasChanges = false;

      if (changes[STORAGE_KEYS.LOGIN_INFO]) {
        newState.loginInfo = changes[STORAGE_KEYS.LOGIN_INFO].newValue || null;
        hasChanges = true;
      }
      if (changes[STORAGE_KEYS.COOKIE]) {
        newState.cookie = changes[STORAGE_KEYS.COOKIE].newValue || '';
        hasChanges = true;
      }
      if (changes[STORAGE_KEYS.CURSOR_USER]) {
        newState.cursorUser = changes[STORAGE_KEYS.CURSOR_USER].newValue || null;
        hasChanges = true;
      }
      if (changes[STORAGE_KEYS.EMAIL]) {
        newState.email = changes[STORAGE_KEYS.EMAIL].newValue || '';
        hasChanges = true;
      }

      if (hasChanges) {
        setState((prev) => ({ ...prev, ...newState }));
      }
    };

    StorageUtil.onChanged(handleStorageChange);
  }, []);

  // 更新登录信息
  const setLoginInfo = useCallback(async (loginInfo: LoginInfo | null) => {
    try {
      if (loginInfo) {
        await StorageUtil.set(STORAGE_KEYS.LOGIN_INFO, loginInfo);
      } else {
        await StorageUtil.remove(STORAGE_KEYS.LOGIN_INFO);
      }
      setState((prev) => ({ ...prev, loginInfo }));
    } catch (error) {
      console.error('Failed to set login info:', error);
    }
  }, []);

  // 更新 Cookie
  const setCookie = useCallback(async (cookie: string) => {
    try {
      if (cookie) {
        await StorageUtil.set(STORAGE_KEYS.COOKIE, cookie);
      } else {
        await StorageUtil.remove(STORAGE_KEYS.COOKIE);
      }
      setState((prev) => ({ ...prev, cookie }));
    } catch (error) {
      console.error('Failed to set cookie:', error);
    }
  }, []);

  // 更新用户信息
  const setCursorUser = useCallback(async (cursorUser: CursorUser | null) => {
    try {
      if (cursorUser) {
        await StorageUtil.set(STORAGE_KEYS.CURSOR_USER, cursorUser);
      } else {
        await StorageUtil.remove(STORAGE_KEYS.CURSOR_USER);
      }
      setState((prev) => ({ ...prev, cursorUser }));
    } catch (error) {
      console.error('Failed to set cursor user:', error);
    }
  }, []);

  // 更新邮箱
  const setEmail = useCallback(async (email: string) => {
    try {
      if (email) {
        await StorageUtil.set(STORAGE_KEYS.EMAIL, email);
      } else {
        await StorageUtil.remove(STORAGE_KEYS.EMAIL);
      }
      setState((prev) => ({ ...prev, email }));
    } catch (error) {
      console.error('Failed to set email:', error);
    }
  }, []);

  // 批量更新状态
  const setState_ = useCallback(async (newState: Partial<LoginState>) => {
    try {
      const promises: Promise<void>[] = [];

      if ('loginInfo' in newState) {
        if (newState.loginInfo) {
          promises.push(StorageUtil.set(STORAGE_KEYS.LOGIN_INFO, newState.loginInfo));
        } else {
          promises.push(StorageUtil.remove(STORAGE_KEYS.LOGIN_INFO));
        }
      }

      if ('cookie' in newState) {
        if (newState.cookie) {
          promises.push(StorageUtil.set(STORAGE_KEYS.COOKIE, newState.cookie));
        } else {
          promises.push(StorageUtil.remove(STORAGE_KEYS.COOKIE));
        }
      }

      if ('cursorUser' in newState) {
        if (newState.cursorUser) {
          promises.push(StorageUtil.set(STORAGE_KEYS.CURSOR_USER, newState.cursorUser));
        } else {
          promises.push(StorageUtil.remove(STORAGE_KEYS.CURSOR_USER));
        }
      }

      if ('email' in newState) {
        if (newState.email) {
          promises.push(StorageUtil.set(STORAGE_KEYS.EMAIL, newState.email));
        } else {
          promises.push(StorageUtil.remove(STORAGE_KEYS.EMAIL));
        }
      }

      await Promise.all(promises);
      setState((prev) => ({ ...prev, ...newState }));
    } catch (error) {
      console.error('Failed to update state:', error);
    }
  }, []);

  // 清空所有状态
  const clearState = useCallback(async () => {
    try {
      await Promise.all([
        StorageUtil.remove(STORAGE_KEYS.LOGIN_INFO),
        StorageUtil.remove(STORAGE_KEYS.COOKIE),
        StorageUtil.remove(STORAGE_KEYS.CURSOR_USER),
        StorageUtil.remove(STORAGE_KEYS.EMAIL),
      ]);
      setState({
        loginInfo: null,
        cookie: '',
        cursorUser: null,
        email: '',
      });
    } catch (error) {
      console.error('Failed to clear state:', error);
    }
  }, []);

  return {
    // 状态
    ...state,
    // 方法
    setLoginInfo,
    setCookie,
    setCursorUser,
    setEmail,
    setState: setState_,
    clearState,
  };
}

