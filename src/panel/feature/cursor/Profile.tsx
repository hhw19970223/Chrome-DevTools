import { useEffect, useRef } from "react";
import { v4 } from "uuid";
import { traceparent } from "@/utils/cursor";
import { TabsUtil } from "@/utils/tabs";
import IConUser from './images/user-1.jpg';

import { 
  Button, 
  Menu, 
  Avatar, 
  Text, 
  Loader,
  Stack,
  Box
} from "@mantine/core";
import { notifications } from '@mantine/notifications';
import { useLoginStore } from "@/panel/hooks/useLoginStore";

const Profile = () => {
  const { 
    loginInfo, 
    cursorUser, 
    cookie, 
    email, 
    setState, 
    clearState 
  } = useLoginStore();
  const interval = useRef<NodeJS.Timeout | null>(null);

  const cleanLogin = () => {
    clearState();
  };

  // 显示通知 - 使用 Mantine Notifications
  const showToast = (type: 'success' | 'error', message: string) => {
    notifications.show({
      title: type === 'success' ? '成功' : '错误',
      message,
      color: type === 'success' ? 'green' : 'red',
      autoClose: 3000,
      withCloseButton: true,
    });
  };

  useEffect(() => {
    if (loginInfo && cookie && !cursorUser) {
      fetch("https://www.hhw31.com/api/cursor/me", {
        method: "POST",
        body: JSON.stringify({ WorkosCursorSessionToken: cookie }),
      })
        .then((res) => res.json())
        .then((res) => {
          console.log(res);
          setState({ cursorUser: res });
        })
        .catch(() => {
          cleanLogin();
          showToast("error", "cookie 有误请重新登录");
        });
    }
  }, [cursorUser, loginInfo, cookie]);

  useEffect(() => {
    if (loginInfo && !email) {
      fetch("https://www.hhw31.com/api/cursor/get-email", {
        method: "POST",
        body: JSON.stringify({ token: loginInfo.accessToken, traceparent }),
      })
        .then((res) => {
          return res.json();
        })
        .then((res) => {
          setState({ email: res.email });
        })
        .catch(() => {
          cleanLogin();
          showToast("error", "token 过期请重新登录");
        });
    }
  }, [cursorUser, loginInfo, cookie]);

  const onLogin = async () => {
    const uuid = v4();
    cleanLogin();

    const verifier = "fBkpWJ6GxvcLGBELpLV0meh0KHOFtj-46PSqeW3oyLw";
    const challenge = "ykVpcg1QuMe5fx7cjBwG6N7s_YRWMR5oa5Y_qeeMpIA";
    
    // 使用 Chrome Tabs API 打开登录地址
    try {
      await TabsUtil.openTab(
        `https://cursor.com/cn/loginDeepControl?challenge=${challenge}&uuid=${uuid}&mode=login`,
        { active: true }
      );
    } catch (error) {
      console.error('Failed to open login page:', error);
      showToast("error", "无法打开登录页面");
      return;
    }

    if (interval.current) {
      clearInterval(interval.current);
    }

    interval.current = setInterval(() => {
      fetch("https://www.hhw31.com/api/cursor/login", {
        method: "POST",
        body: JSON.stringify({
          traceparent,
          verifier,
          uuid,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          setState({ loginInfo: res });
          if (interval.current) {
            clearInterval(interval.current);
            interval.current = null;
          }
        });
    }, 1000);
  };

  useEffect(() => { 
    return () => {
      if (interval.current) {
        clearInterval(interval.current);
        interval.current = null;
      }
    }
  }, []);

  return (
    <Box
      style={{
        position: 'fixed',
        top: '0px',
        right: '0px',
        zIndex: 1000,
        padding: '16px',
        backgroundColor: 'rgba(255, 255, 255, 1)',
      }}
    >
      {loginInfo ? (
        <Menu shadow="md" width={240}>
          <Menu.Target>
            <Avatar
              src={IConUser}
              alt="User Avatar"
              radius="xl"
              size="md"
              style={{ cursor: 'pointer' }}
            />
          </Menu.Target>

          <Menu.Dropdown>
            {(cursorUser || email) && (
              <>
                <Menu.Label>用户信息</Menu.Label>
                <Box px="sm" py="xs">
                  <Stack gap={4}>
                    <Text size="sm" fw={500}>
                      {cursorUser?.name || '用户'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {cursorUser?.email || email}
                    </Text>
                  </Stack>
                </Box>
                <Menu.Divider />
              </>
            )}
            
            <Menu.Label>账户操作</Menu.Label>
            <Menu.Item 
              color="red" 
              onClick={cleanLogin}
            >
              退出登录
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ) : (
        <Button
          variant="filled"
          color="blue"
          radius="md"
          leftSection={interval.current ? <Loader size="xs" color="white" /> : null}
          onClick={onLogin}
          disabled={!!interval.current}
        >
          登录
        </Button>
      )}
    </Box>
  );
};

export default Profile;
