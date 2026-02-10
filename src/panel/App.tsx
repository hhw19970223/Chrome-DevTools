import { Container, Stack, Tabs } from "@mantine/core";
import { IconBrandFigma, IconBrandDiscord } from '@tabler/icons-react';
import { Figma } from "./feature/figma";
import Profile from "./feature/cursor/Profile";
import { FigmaTest } from "./feature/figma-test";
import { Discord } from "./feature/discord";

function App() {
  return (
    <>
      <Profile />
      <Container size="lg" py="md" maw="100%" h={'100vh'}>
        <Stack gap="md">
          <Tabs defaultValue="figma" color="green" >
            <Tabs.List>
              <Tabs.Tab value="figma" leftSection={<IconBrandFigma size={16} />}>Figma</Tabs.Tab>
              <Tabs.Tab value="figmaTest" leftSection={<IconBrandFigma size={16} />}>Figma测试用例</Tabs.Tab>
              <Tabs.Tab value="discord" leftSection={<IconBrandDiscord size={16} />}>discord翻译</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="figma" pt="md">
              <Figma />
            </Tabs.Panel>

            <Tabs.Panel value="figmaTest" pt="md">
              <FigmaTest />
            </Tabs.Panel>

            <Tabs.Panel value="discord" pt="md">
              <Discord />
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>
    </>
  );
}

export default App;
