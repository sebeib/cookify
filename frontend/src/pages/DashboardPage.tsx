import { Badge, Card, Grid, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconCompass, IconKey, IconSoup, IconUsers } from "@tabler/icons-react";
import { useAuth } from "../auth/AuthProvider";

const quickCards = [
  {
    title: "Users area",
    description: "Authentication and navigation are already wired into the backend session model.",
    icon: IconUsers,
  },
  {
    title: "Recipe space",
    description: "A clean placeholder where the actual cookify product can grow next.",
    icon: IconSoup,
  },
  {
    title: "Session-based auth",
    description: "Frontend login is connected to the backend session and bearer-token flow.",
    icon: IconKey,
  },
];

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <Stack gap="xl">
      <Card className="dashboard-banner" padding="xl" radius="xl">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text className="eyebrow">Overview</Text>
            <Title order={1}>Hello, {user?.displayName}</Title>
            <Text c="dimmed" mt="sm" maw={640}>
              The initial frontend shell is ready. You can log in, keep the session in local
              storage, navigate between routes and log out again against the backend API.
            </Text>
          </div>

          <Badge color="teal" variant="light" size="lg">
            Ready for next features
          </Badge>
        </Group>
      </Card>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        {quickCards.map((card) => (
          <Card key={card.title} radius="xl" padding="lg" withBorder>
            <ThemeIcon size={42} radius="md" color="teal" variant="light">
              <card.icon size={22} />
            </ThemeIcon>
            <Title order={4} mt="lg">
              {card.title}
            </Title>
            <Text c="dimmed" mt="sm">
              {card.description}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      <Grid gap="lg">
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Card radius="xl" padding="xl" withBorder>
            <Group gap="sm" mb="md">
              <ThemeIcon radius="md" color="moss" variant="light">
                <IconCompass size={18} />
              </ThemeIcon>
              <Title order={3}>Current direction</Title>
            </Group>
            <Text c="dimmed">
              This dashboard is intentionally lightweight. It proves the application frame, so the
              next steps can focus on actual domain features instead of setup work.
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Card radius="xl" padding="xl" withBorder>
            <Text c="dimmed" fz="sm" fw={700} tt="uppercase">
              Signed in as
            </Text>
            <Title order={3} mt="xs">
              {user?.username}
            </Title>
            <Text c="dimmed" mt="sm">
              Role id: {user?.roleId}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
