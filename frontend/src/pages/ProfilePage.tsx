import { useEffect, useState } from "react";
import {
  Button,
  Card,
  FileInput,
  Grid,
  Group,
  Image,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconLock, IconPhoto } from "@tabler/icons-react";
import { changePassword, getProfile, isUnauthorizedError, updateProfile } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { UserAvatar } from "../components/UserAvatar";

export function ProfilePage() {
  const { sessionId, setCurrentUser, user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let active = true;

    void (async () => {
      setIsLoading(true);

      try {
        const profile = await getProfile(sessionId);
        if (!active) {
          return;
        }

        setCurrentUser(profile);
        setDisplayName(profile.displayName);
        setProfileImage(profile.profileImage);
      } catch (error) {
        if (!active || isUnauthorizedError(error)) {
          return;
        }

        notifications.show({
          color: "red",
          title: "Profil konnte nicht geladen werden",
          message: error instanceof Error ? error.message : "Bitte versuche es erneut.",
        });
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [sessionId, setCurrentUser]);

  return (
    <Stack gap="xl" py="xl">
      <div className="section-heading">
        <Text className="eyebrow">Profil</Text>
        <Title order={2}>Dein Konto</Title>
        <Text c="dimmed" mt="xs" maw={620}>
          Pflege dein Profilbild und halte dein Passwort aktuell.
        </Text>
      </div>

      <Card className="section-card profile-card" radius="xl" padding="xl">
        <Stack gap="lg">
          <div>
            <Title order={3}>Profilbild und Anzeigename</Title>
            <Text c="dimmed" mt="xs">
              Das Profilbild erscheint in der Navigation und neben deinen Rezepten.
            </Text>
          </div>

          <Group gap="md" wrap="nowrap" align="flex-start">
            <UserAvatar
              displayName={displayName || user?.displayName}
              image={profileImage}
              size={88}
            />

            <div className="profile-avatar-copy">
              <Text fw={600}>{displayName || user?.displayName}</Text>
              <Text c="dimmed" fz="sm">
                @{user?.username}
              </Text>
            </div>
          </Group>

          {profileImage ? (
            <Image
              src={profileImage}
              alt={displayName || "Profilbild"}
              radius="xl"
              className="profile-preview-image"
            />
          ) : null}

          <Grid gap="lg">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Benutzername"
                value={user?.username ?? ""}
                readOnly
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Anzeigename"
                value={displayName}
                onChange={(event) => setDisplayName(event.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <FileInput
                label="Profilbild"
                placeholder="Bild auswaehlen"
                accept="image/*"
                clearable
                leftSection={<IconPhoto size={16} />}
                value={profileImageFile}
                onChange={async (file) => {
                  setProfileImageFile(file);

                  if (!file) {
                    setProfileImage(null);
                    return;
                  }

                  try {
                    setProfileImage(await fileToDataUrl(file));
                  } catch (error) {
                    notifications.show({
                      color: "red",
                      title: "Bild konnte nicht gelesen werden",
                      message:
                        error instanceof Error ? error.message : "Bitte versuche ein anderes Bild.",
                    });
                  }
                }}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end">
            <Button
              color="sage"
              loading={isSavingProfile || isLoading}
              onClick={async () => {
                if (!displayName.trim()) {
                  notifications.show({
                    color: "red",
                    title: "Anzeigename fehlt",
                    message: "Bitte gib einen Anzeigenamen ein.",
                  });
                  return;
                }

                setIsSavingProfile(true);

                try {
                  const updatedUser = await updateProfile(
                    {
                      displayName: displayName.trim(),
                      profileImage,
                    },
                    sessionId,
                  );

                  setCurrentUser(updatedUser);
                  setProfileImage(updatedUser.profileImage);
                  setProfileImageFile(null);

                  notifications.show({
                    color: "sage",
                    title: "Profil gespeichert",
                    message: "Dein Profil wurde aktualisiert.",
                  });
                } catch (error) {
                  if (isUnauthorizedError(error)) {
                    return;
                  }

                  notifications.show({
                    color: "red",
                    title: "Profil konnte nicht gespeichert werden",
                    message: error instanceof Error ? error.message : "Bitte versuche es erneut.",
                  });
                } finally {
                  setIsSavingProfile(false);
                }
              }}
            >
              Profil speichern
            </Button>
          </Group>
        </Stack>
      </Card>

      <Card className="section-card profile-card" radius="xl" padding="xl">
        <Stack gap="lg">
          <div>
            <Title order={3}>Passwort ändern</Title>
            <Text c="dimmed" mt="xs">
              Verwende dein aktuelles Passwort zur Bestätigung.
            </Text>
          </div>

          <Grid gap="lg">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <PasswordInput
                label="Aktuelles Passwort"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.currentTarget.value)}
                leftSection={<IconLock size={16} />}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <PasswordInput
                label="Neues Passwort"
                value={newPassword}
                onChange={(event) => setNewPassword(event.currentTarget.value)}
                leftSection={<IconLock size={16} />}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <PasswordInput
                label="Neues Passwort wiederholen"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                leftSection={<IconLock size={16} />}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end">
            <Button
              color="sage"
              variant="light"
              loading={isSavingPassword}
              onClick={async () => {
                if (!currentPassword || !newPassword || !confirmPassword) {
                  notifications.show({
                    color: "red",
                    title: "Passwort unvollstaendig",
                    message: "Bitte fuelle alle Passwortfelder aus.",
                  });
                  return;
                }

                if (newPassword !== confirmPassword) {
                  notifications.show({
                    color: "red",
                    title: "Passwoerter stimmen nicht ueberein",
                    message: "Bitte pruefe die neue Passworteingabe.",
                  });
                  return;
                }

                setIsSavingPassword(true);

                try {
                  await changePassword(
                    {
                      currentPassword,
                      newPassword,
                    },
                    sessionId,
                  );

                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");

                  notifications.show({
                    color: "sage",
                    title: "Passwort aktualisiert",
                    message: "Dein Passwort wurde erfolgreich geaendert.",
                  });
                } catch (error) {
                  if (isUnauthorizedError(error)) {
                    return;
                  }

                  notifications.show({
                    color: "red",
                    title: "Passwort konnte nicht geaendert werden",
                    message: error instanceof Error ? error.message : "Bitte versuche es erneut.",
                  });
                } finally {
                  setIsSavingPassword(false);
                }
              }}
            >
              Passwort ändern
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Das ausgewaehlte Bild konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}
