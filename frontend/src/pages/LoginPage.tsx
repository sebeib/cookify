import { startTransition } from "react";
import { Navigate } from "react-router-dom";
import { Button, Card, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconArrowRight } from "@tabler/icons-react";
import { useAuth } from "../auth/AuthProvider";
import { CookifyLogo } from "../components/CookifyLogo";

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
      <Card className="surface-card login-card" padding="xl" radius="xl">
        <form
          onSubmit={form.onSubmit(async (values) => {
            await login(values.username, values.password);
            startTransition(() => {
              form.reset();
            });
          })}
        >
          <Stack gap="xl">
            <Stack gap="xs" align="center">
              <CookifyLogo size={150} />
              <Title order={1} className="login-wordmark">
                Cookify
              </Title>
            </Stack>

            <Stack gap="md">
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
            </Stack>
          </Stack>
        </form>
      </Card>
    </div>
  );
}
