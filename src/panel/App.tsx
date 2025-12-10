import { Container, Title, Stack, Group, Badge, Card, Text } from '@mantine/core';
import { useDevToolsBridge } from './hooks/useDevToolsBridge';
import { PageInspector } from './feature/PageInspector';

function App() {
  const {
    isReady,
    isContentScriptReady,
    isInjectedScriptReady,
  } = useDevToolsBridge();

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Title order={2}>DevTools Extension Panel</Title>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="sm">
            <Text fw={500}>连接状态</Text>
            <Group>
              <Badge color={isReady ? 'green' : 'gray'}>
                Bridge: {isReady ? '已连接' : '未连接'}
              </Badge>
              <Badge color={isContentScriptReady ? 'green' : 'gray'}>
                Content Script: {isContentScriptReady ? '就绪' : '未就绪'}
              </Badge>
              <Badge color={isInjectedScriptReady ? 'green' : 'gray'}>
                Injected Script: {isInjectedScriptReady ? '就绪' : '未就绪'}
              </Badge>
            </Group>
          </Stack>
        </Card>

        <PageInspector />
      </Stack>
    </Container>
  );
}

export default App;
