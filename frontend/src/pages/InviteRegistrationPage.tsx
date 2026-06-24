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
      username: (value) => (value.trim() ? null : "Bitte Benutzernamen eingeben."),
      displayName: (value) => (value.trim() ? null : "Bitte Anzeigenamen eingeben."),
      password: (value) => (value.trim() ? null : "Bitte Passwort eingeben."),
      confirmPassword: (value, values) =>
        value.trim()
          ? value === values.password
            ? null
            : "Die Passwoerter stimmen nicht ueberein."
          : "Bitte Passwort wiederholen.",
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
                Einladungstoken wird geprueft...
              </Text>
            )}
            {inviteState === "valid" && (
              <Text c="dimmed" ta="center" maw={320}>
                Lege dein Konto mit der Einladung an, die du erhalten hast.
              </Text>
            )}
            {inviteState === "invalid" && (
              <Text c="red" ta="center" maw={320}>
                Dieser Einladungslink ist ungueltig oder wurde bereits verwendet.
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
                    title: "Konto erstellt",
                    message: "Dein Konto ist bereit. Bitte melde dich an.",
                  });

                  startTransition(() => navigate("/login", { replace: true }));
                } catch (error) {
                  const message =
                    error instanceof Error ? error.message : "Die Registrierung konnte nicht abgeschlossen werden.";

                  notifications.show({
                    color: "red",
                    title: "Registrierung fehlgeschlagen",
                    message,
                  });
                } finally {
                  setIsSubmitting(false);
                }
              })}
            >
              <Stack gap="md">
                <TextInput
                  label="Anzeigename"
                  placeholder="Jane Doe"
                  size="md"
                  autoComplete="name"
                  {...form.getInputProps("displayName")}
                />

                <TextInput
                  label="Benutzername"
                  placeholder="jane.doe"
                  size="md"
                  autoComplete="username"
                  {...form.getInputProps("username")}
                />

                <PasswordInput
                  label="Passwort"
                  placeholder="Passwort waehlen"
                  size="md"
                  autoComplete="new-password"
                  {...form.getInputProps("password")}
                />

                <PasswordInput
                  label="Passwort wiederholen"
                  placeholder="Passwort erneut eingeben"
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
                  Konto erstellen
                </Button>
              </Stack>
            </form>
          )}

          {inviteState === "invalid" && (
            <Button variant="light" color="sage" onClick={() => navigate("/login", { replace: true })}>
              Zurueck zum Start
            </Button>
          )}
        </Stack>
      </Card>
    </div>
  );
}
