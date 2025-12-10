import { Container, Stack, Card, Tabs } from "@mantine/core";
import { IconBrandFigma } from '@tabler/icons-react';
import { Figma } from "./feature/figma";

function App() {
  return (
    <Container size="lg" py="md">
      <Stack gap="md">
        <Tabs defaultValue="figma" color="green" >
          <Tabs.List>
            <Tabs.Tab value="figma" leftSection={<IconBrandFigma size={16} />}>figma</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="page" pt="md">
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Stack gap="md">
                <Figma />
              </Stack>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}

export default App;
