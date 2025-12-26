import { Container, Stack, Tabs } from "@mantine/core";
import { IconBrandFigma } from '@tabler/icons-react';
import { Figma } from "./feature/figma";
import Profile from "./feature/cursor/Profile";

function App() {
  return (
    <>
      <Profile />
      <Container size="lg" py="md" maw="100%" h={'100vh'}>
        <Stack gap="md">
          <Tabs defaultValue="figma" color="green" >
            <Tabs.List>
              <Tabs.Tab value="figma" leftSection={<IconBrandFigma size={16} />}>Figma</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="figma" pt="md">
              <Figma />
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>
    </>
  );
}

export default App;
