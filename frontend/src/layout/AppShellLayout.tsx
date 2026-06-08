import { useState } from "react";
import { NavLink as RouterNavLink, Outlet, useLocation } from "react-router-dom";
import {
  AppShell,
  Avatar,
  Burger,
  Button,
  Divider,
  Group,
  NavLink,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconBook2,
  IconChefHat,
  IconLogout,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import { useAuth } from "../auth/AuthProvider";

const navigationItems = [
  { label: "Overview", to: "/", icon: IconChefHat },
  { label: "Users", to: "/users", icon: IconUsers },
  { label: "Recipes", to: "/recipes", icon: IconBook2 },
  { label: "Settings", to: "/settings", icon: IconSettings },
];

export function AppShellLayout() {
  const [opened, setOpened] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <AppShell
      header={{ height: 74 }}
      navbar={{ width: 300, breakpoint: "md", collapsed: { mobile: !opened } }}
      padding="lg"
    >
      <AppShell.Header>
        <Group justify="space-between" h="100%" px="lg">
          <Group gap="md">
            <Burger
              opened={opened}
              onClick={() => setOpened((current) => !current)}
              hiddenFrom="md"
              size="sm"
            />
            <Avatar radius="md" color="teal" variant="filled">
              C
            </Avatar>
            <div>
              <Text c="dimmed" fz="xs" fw={600} tt="uppercase">
                cookify
              </Text>
              <Title order={4}>Kitchen control center</Title>
            </div>
          </Group>

          <Button
            variant="subtle"
            color="dark"
            leftSection={<IconLogout size={16} />}
            onClick={() => void logout()}
          >
            Logout
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack justify="space-between" h="100%">
          <Stack gap="xs">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                component={RouterNavLink}
                to={item.to}
                label={item.label}
                leftSection={<item.icon size={18} stroke={1.8} />}
                active={location.pathname === item.to}
                variant="filled"
                color="teal"
                onClick={() => setOpened(false)}
              />
            ))}
          </Stack>

          <div>
            <Divider mb="md" />
            <Group wrap="nowrap">
              <Avatar radius="xl" color="moss" variant="filled">
                {user?.displayName.slice(0, 1)}
              </Avatar>
              <div>
                <Text fw={600}>{user?.displayName}</Text>
                <Text c="dimmed" fz="sm">
                  {user?.username}
                </Text>
              </div>
            </Group>
          </div>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
