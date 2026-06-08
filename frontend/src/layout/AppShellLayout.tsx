import { useState } from "react";
import { NavLink as RouterNavLink, Outlet, useLocation } from "react-router-dom";
import {
  AppShell,
  Burger,
  Button,
  Container,
  Divider,
  Group,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import {
  IconBookmark,
  IconChefHat,
  IconCompass,
  IconLogout,
  IconShield,
  IconToolsKitchen2,
  IconUserCircle,
} from "@tabler/icons-react";
import { useAuth } from "../auth/AuthProvider";
import { isAdmin } from "../auth/roles";
import { CookifyLogo } from "../components/CookifyLogo";

const navigationItems = [
  { label: "Home", to: "/", icon: IconChefHat },
  { label: "Discover", to: "/discover", icon: IconCompass },
  { label: "Recipes", to: "/recipes", icon: IconToolsKitchen2 },
  { label: "Saved", to: "/saved", icon: IconBookmark },
  { label: "Profile", to: "/profile", icon: IconUserCircle },
];

export function AppShellLayout() {
  const [opened, setOpened] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();
  const isAdminUser = isAdmin(user);
  const visibleNavigationItems = isAdminUser
    ? [...navigationItems, { label: "Admin", to: "/admin", icon: IconShield }]
    : navigationItems;
  const isActive = (path: string) =>
    path === "/" ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <AppShell
      header={{ height: 80 }}
      navbar={{ width: 280, breakpoint: "md", collapsed: { desktop: true, mobile: !opened } }}
      padding={0}
    >
      <AppShell.Header className="shell-header">
        <Container size="xl" h="100%" className="shell-frame">
          <Group justify="space-between" h="100%" wrap="nowrap">
            <Group gap="md" wrap="nowrap">
              <Burger
                opened={opened}
                onClick={() => setOpened((current) => !current)}
                hiddenFrom="md"
                size="sm"
              />
              <Group gap="sm" wrap="nowrap">
                <CookifyLogo size={50} />
                <div>
                  <Text className="shell-brand" fz="xs" fw={600}>
                    cookify
                  </Text>
                  <Title order={4}>Recipe collection</Title>
                </div>
              </Group>
            </Group>

            <Group gap="xs" visibleFrom="md" className="shell-desktop-nav">
              {visibleNavigationItems.map((item) => {
                const active = isActive(item.to);

                return (
                  <UnstyledButton
                    key={item.to}
                    component={RouterNavLink}
                    to={item.to}
                    className={active ? "shell-nav-link shell-nav-link-active" : "shell-nav-link"}
                  >
                    <span className="shell-nav-link-inner">
                      <item.icon size={16} stroke={1.8} />
                      <span>{item.label}</span>
                    </span>
                  </UnstyledButton>
                );
              })}
            </Group>

            <Group gap="sm" wrap="nowrap">
              <Group gap={0} className="shell-user-pill" visibleFrom="md">
                <Text fw={600} fz="sm">
                  {user?.displayName}
                </Text>
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
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Navbar p="md" className="shell-navbar">
        <Stack justify="space-between" h="100%">
          <Stack gap="xs">
            {visibleNavigationItems.map((item) => (
              <Button
                key={item.to}
                component={RouterNavLink}
                to={item.to}
                leftSection={<item.icon size={18} stroke={1.8} />}
                variant={isActive(item.to) ? "light" : "subtle"}
                color="sage"
                justify="flex-start"
                onClick={() => setOpened(false)}
              >
                {item.label}
              </Button>
            ))}
          </Stack>

          <div>
            <Divider mb="md" />
            <Group wrap="nowrap">
              <div className="shell-user-avatar">{user?.displayName.slice(0, 1)}</div>
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

      <AppShell.Main className="shell-main">
        <Container size="xl" className="shell-frame shell-content">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
