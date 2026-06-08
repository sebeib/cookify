import { startTransition } from "react";
import { Navigate } from "react-router-dom";
import {
  Anchor,
  Button,
  Card,
  Grid,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconArrowRight } from "@tabler/icons-react";
import { useAuth } from "../auth/AuthProvider";

type LoginFormValues = {
  username: string;
  password: string;
};

export function LoginPage() {
  const { isAuthenticated, isLoggingIn, login } = useAuth();
  const form = useForm<LoginFormValues>({
    initialValues: {
      username: "",
      password: "",
    },
    validate: {
      username: (value) => (value.trim() ? null : "Please enter your username."),
      password: (value) => (value.trim() ? null : "Please enter your password."),
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login-page">
      <Grid gap="xl" align="stretch">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card className="hero-panel" padding="xl" radius="xl">
            <Text className="eyebrow">Cook with confidence</Text>
            <Title order={1} className="hero-title">
              Your kitchen workspace starts with one clean sign-in.
            </Title>
            <Text className="hero-copy">
              The frontend is ready for authentication, routing and a first application shell.
              From here we can grow dashboards, recipe flows and user management step by step.
            </Text>
            <Group gap="sm" mt="xl">
              <div className="accent-chip">React + TypeScript</div>
              <div className="accent-chip">Mantine UI</div>
              <div className="accent-chip">React Router</div>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card padding="xl" radius="xl" withBorder>
            <form
              onSubmit={form.onSubmit(async (values) => {
                await login(values.username, values.password);
                startTransition(() => {
                  form.reset();
                });
              })}
            >
              <Stack gap="lg">
                <div>
                  <Text c="dimmed" fz="sm" fw={700} tt="uppercase">
                    Sign in
                  </Text>
                  <Title order={2} mt={6}>
                    Welcome back
                  </Title>
                  <Text c="dimmed" mt="xs">
                    Use your cookify account to enter the admin shell.
                  </Text>
                </div>

                <TextInput
                  label="Username"
                  placeholder="jane.doe"
                  size="md"
                  autoComplete="username"
                  {...form.getInputProps("username")}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Your secure password"
                  size="md"
                  autoComplete="current-password"
                  {...form.getInputProps("password")}
                />

                <Button
                  type="submit"
                  size="md"
                  loading={isLoggingIn}
                  rightSection={<IconArrowRight size={18} />}
                >
                  Sign in
                </Button>

                <Text c="dimmed" fz="sm">
                  No public sign-up yet. New users are currently created via invite flow from the backend.
                </Text>

                <Anchor href="http://localhost:8080/q/dev-ui/welcome" target="_blank" size="sm">
                  Open Quarkus Dev UI
                </Anchor>
              </Stack>
            </form>
          </Card>
        </Grid.Col>
      </Grid>
    </div>
  );
}
