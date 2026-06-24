import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button, Card, Group, Radio, Stack, Text, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";
import { createInvite } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { isAdmin } from "../auth/roles";

type InviteRole = "ADMIN" | "USER";

const inviteRoleLabels: Record<InviteRole, string> = {
  ADMIN: "Administrator",
  USER: "Benutzer",
};

export function AdminDashboardPage() {
  const { sessionId, user } = useAuth();
  const [inviteRole, setInviteRole] = useState<InviteRole>("USER");
  const [isCreating, setIsCreating] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  if (!isAdmin(user)) {
    return <Navigate to="/" replace />;
  }

  const inviteLink = createdToken ? `${window.location.origin}/invite/${createdToken}` : null;

  return (
    <Stack gap="xl" py="xl">
      <div className="section-heading">
        <Text className="eyebrow">Verwaltung</Text>
        <Title order={2}>Einladungen</Title>
      </div>

      <Card className="section-card" radius="xl" padding="xl">
        <Stack gap="lg">
          <div>
            <Title order={3}>Einladungstoken erstellen</Title>
            <Text c="dimmed" mt="xs" maw={560}>
              Erzeuge ein einmaliges Einladungstoken und teile den Link mit der Person, die ein
              Konto anlegen soll.
            </Text>
          </div>

          <Radio.Group
            label="Rolle fuer das neue Konto"
            value={inviteRole}
            onChange={(value) => setInviteRole(value as InviteRole)}
          >
            <Group mt="sm">
              <Radio value="USER" label="Benutzer" />
              <Radio value="ADMIN" label="Administrator" />
            </Group>
          </Radio.Group>

          <Group>
            <Button
              color="sage"
              leftSection={<IconPlus size={18} />}
              loading={isCreating}
              onClick={async () => {
                setIsCreating(true);

                try {
                  const invite = await createInvite(inviteRole, sessionId);
                  setCreatedToken(invite.id);
                  notifications.show({
                    color: "sage",
                    title: "Einladung erstellt",
                    message: `Ein neues Einladungstoken fuer ${inviteRoleLabels[inviteRole]} wurde erzeugt.`,
                  });
                } catch (error) {
                  const message =
                    error instanceof Error ? error.message : "Die Einladung konnte nicht erstellt werden.";

                  notifications.show({
                    color: "red",
                    title: "Einladung fehlgeschlagen",
                    message,
                  });
                } finally {
                  setIsCreating(false);
                }
              }}
            >
              Einladung erstellen
            </Button>
          </Group>

          {createdToken && inviteLink && (
            <Stack gap="sm">
              <Text fw={600}>Erzeugtes Token</Text>
              <TextInput readOnly value={createdToken} />
              <Text fw={600} mt="sm">
                Einladungslink
              </Text>
              <TextInput readOnly value={inviteLink} />
            </Stack>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
