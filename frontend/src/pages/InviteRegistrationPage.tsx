import { startTransition, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button, Card, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconArrowRight } from "@tabler/icons-react";
import { CookifyLogo } from "../components/CookifyLogo";
import { checkInvite, registerWithInvite } from "../api";

type InviteRegistrationFormValues = {
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
};

export function InviteRegistrationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteState, setInviteState] = useState<"checking" | "valid" | "invalid">("checking");
  const form = useForm<InviteRegistrationFormValues>({
    initialValues: {
      username: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
    validate: {
      username: (value) => (value.trim() ? null : "Please enter a username."),
      displayName: (value) => (value.trim() ? null : "Please enter a display name."),
      password: (value) => (value.trim() ? null : "Please enter a password."),
      confirmPassword: (value, values) =>
        value.trim()
          ? value === values.password
            ? null
            : "Passwords do not match."
          : "Please repeat your password.",
    },
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    startTransition(() => {
      setInviteState("checking");
    });

    void checkInvite(token)
      .then(() => {
        if (!cancelled) {
          setInviteState("valid");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInviteState("invalid");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="login-page">
      <Card className="surface-card login-card invite-card" padding="xl" radius="xl">
        <Stack gap="xl">
          <Stack gap="xs" align="center">
            <CookifyLogo size={112} />
            <Title order={1} className="login-wordmark">
              Cookify
            </Title>
            {inviteState === "checking" && (
              <Text c="dimmed" ta="center" maw={320}>
                Checking your invite token...
              </Text>
            )}
            {inviteState === "valid" && (
              <Text c="dimmed" ta="center" maw={320}>
                Create your account with the invite you received.
              </Text>
            )}
            {inviteState === "invalid" && (
              <Text c="red" ta="center" maw={320}>
                This invite link is invalid or has already been used.
              </Text>
            )}
          </Stack>

          {inviteState === "valid" && (
            <form
              onSubmit={form.onSubmit(async (values) => {
                setIsSubmitting(true);

                try {
                  await registerWithInvite(token, {
                    username: values.username.trim(),
                    displayName: values.displayName.trim(),
                    password: values.password,
                  });

                  notifications.show({
                    color: "sage",
                    title: "Account created",
                    message: "Your account is ready. Please sign in.",
                  });

                  startTransition(() => navigate("/login", { replace: true }));
                } catch (error) {
                  const message =
                    error instanceof Error ? error.message : "Registration could not be completed.";

                  notifications.show({
                    color: "red",
                    title: "Registration failed",
                    message,
                  });
                } finally {
                  setIsSubmitting(false);
                }
              })}
            >
              <Stack gap="md">
                <TextInput
                  label="Display name"
                  placeholder="Jane Doe"
                  size="md"
                  autoComplete="name"
                  {...form.getInputProps("displayName")}
                />

                <TextInput
                  label="Username"
                  placeholder="jane.doe"
                  size="md"
                  autoComplete="username"
                  {...form.getInputProps("username")}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Choose a password"
                  size="md"
                  autoComplete="new-password"
                  {...form.getInputProps("password")}
                />

                <PasswordInput
                  label="Repeat password"
                  placeholder="Repeat your password"
                  size="md"
                  autoComplete="new-password"
                  {...form.getInputProps("confirmPassword")}
                />

                <Button
                  type="submit"
                  size="md"
                  loading={isSubmitting}
                  rightSection={<IconArrowRight size={18} />}
                >
                  Create account
                </Button>
              </Stack>
            </form>
          )}

          {inviteState === "invalid" && (
            <Button variant="light" color="sage" onClick={() => navigate("/login", { replace: true })}>
              Back to start
            </Button>
          )}
        </Stack>
      </Card>
    </div>
  );
}
