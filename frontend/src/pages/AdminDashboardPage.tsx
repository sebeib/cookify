import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button, Card, Group, Radio, Stack, Text, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";
import { createInvite } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { isAdmin } from "../auth/roles";

type InviteRole = "ADMIN" | "USER";

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
        <Text className="eyebrow">Admin</Text>
        <Title order={2}>Invite management</Title>
      </div>

      <Card className="section-card" radius="xl" padding="xl">
        <Stack gap="lg">
          <div>
            <Title order={3}>Create invite token</Title>
            <Text c="dimmed" mt="xs" maw={560}>
              Generate a one-time invite token and share the resulting link with the person who
              should create an account.
            </Text>
          </div>

          <Radio.Group
            label="Role for the new account"
            value={inviteRole}
            onChange={(value) => setInviteRole(value as InviteRole)}
          >
            <Group mt="sm">
              <Radio value="USER" label="USER" />
              <Radio value="ADMIN" label="ADMIN" />
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
                    title: "Invite created",
                    message: `A new ${inviteRole} invite token was generated.`,
                  });
                } catch (error) {
                  const message =
                    error instanceof Error ? error.message : "The invite could not be created.";

                  notifications.show({
                    color: "red",
                    title: "Invite creation failed",
                    message,
                  });
                } finally {
                  setIsCreating(false);
                }
              }}
            >
              Create invite
            </Button>
          </Group>

          {createdToken && inviteLink && (
            <Stack gap="sm">
              <Text fw={600}>Generated token</Text>
              <TextInput readOnly value={createdToken} />
              <Text fw={600} mt="sm">
                Invite link
              </Text>
              <TextInput readOnly value={inviteLink} />
            </Stack>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
