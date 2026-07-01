import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { NavLink as RouterNavLink, Navigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Grid,
  Group,
  Image,
  List,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  ThemeIcon,
  Tooltip,
  Title,
} from "@mantine/core";
import { IconArrowLeft, IconEdit, IconPhoto } from "@tabler/icons-react";
import NoSleep from "nosleep.js";
import { getRecipe, isUnauthorizedError } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { UserAvatar } from "../components/UserAvatar";
import { recipeMacroItems } from "../recipe/macro";
import { TagBadge } from "../recipe/TagBadge";
import { formatRecipeUnit } from "../recipe/units";
import type { Recipe } from "../types";

const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

type WakeLockSentinelLike = {
  release: () => Promise<void>;
  addEventListener?: (type: "release", listener: () => void) => void;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
};

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { sessionId, user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRecipeModeEnabled, setIsRecipeModeEnabled] = useState(false);
  const [recipeModeError, setRecipeModeError] = useState<string | null>(null);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const noSleepRef = useRef<NoSleep | null>(null);
  const wakeLockSupported =
    typeof navigator !== "undefined" && "wakeLock" in (navigator as WakeLockNavigator);

  useEffect(() => {
    if (!id) {
      return;
    }

    let active = true;

    void (async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextRecipe = await getRecipe(id, sessionId);
        if (active) {
          setRecipe(nextRecipe);
        }
      } catch (error) {
        if (!active || isUnauthorizedError(error)) {
          return;
        }

        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Das Rezept konnte nicht geladen werden.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [id, sessionId]);

  useEffect(() => {
    return () => {
      void releaseWakeLock(wakeLockRef);
      disableNoSleep(noSleepRef);
    };
  }, []);

  useEffect(() => {
    if (!isRecipeModeEnabled || !wakeLockSupported) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (wakeLockRef.current) {
        return;
      }

      void requestWakeLock({
        wakeLockRef,
        onError: (message) => {
          setRecipeModeError(message);
          setIsRecipeModeEnabled(false);
        },
        onSuccess: () => setRecipeModeError(null),
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRecipeModeEnabled, wakeLockSupported]);

  if (!id) {
    return <Navigate to="/recipes" replace />;
  }

  if (errorMessage) {
    return (
      <Stack gap="xl" py="xl">
        <Button
          component={RouterNavLink}
          to="/recipes"
          variant="subtle"
          color="gray"
          leftSection={<IconArrowLeft size={16} />}
        >
          Zurueck zu den Rezepten
        </Button>

        <Card className="section-card" radius="xl" padding="xl">
          <Stack gap="sm">
            <Title order={3}>Rezept konnte nicht geladen werden</Title>
            <Text c="dimmed">{errorMessage}</Text>
          </Stack>
        </Card>
      </Stack>
    );
  }

  if (isLoading || !recipe) {
    return (
      <Stack gap="xl" py="xl">
        <Card className="section-card" radius="xl" padding="xl">
          <Title order={3}>Rezept wird geladen...</Title>
        </Card>
      </Stack>
    );
  }

  const macroItems = recipeMacroItems
    .map((item) => ({ ...item, value: recipe[item.key] }))
    .filter((item) => item.value != null);
  const isOwnRecipe = recipe.authorId === user?.id;

  return (
    <Stack gap="xl" py="xl">
      <Group justify="space-between" align="center">
        <Button
          component={RouterNavLink}
          to="/recipes"
          variant="subtle"
          color="gray"
          leftSection={<IconArrowLeft size={16} />}
        >
          Zurueck zu den Rezepten
        </Button>

        {isOwnRecipe ? (
          <Button
            component={RouterNavLink}
            to={`/recipes/${recipe.id}/edit`}
            variant="light"
            color="sage"
            leftSection={<IconEdit size={16} />}
          >
            Rezept bearbeiten
          </Button>
        ) : null}
      </Group>

      <Card className="section-card recipe-detail-hero" radius="xl" padding="xl">
        <Grid gap="xl" align="center">
          <Grid.Col span={{ base: 12, lg: 5 }}>
            {recipe.image ? (
              <Image
                src={recipe.image}
                alt={recipe.title}
                className="recipe-detail-image"
                radius="xl"
              />
            ) : (
              <div className="recipe-detail-image recipe-tile-image-placeholder">
                <ThemeIcon size={56} radius="xl" color="sage" variant="white">
                  <IconPhoto size={28} />
                </ThemeIcon>
              </div>
            )}
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <Stack gap="md">
              <div>
                <Text className="eyebrow">Rezept</Text>
                <Title order={1} className="recipe-detail-title">
                  {recipe.title}
                </Title>
              </div>

              <Group gap="sm" className="recipe-tile-meta" wrap="nowrap">
                <UserAvatar
                  displayName={recipe.authorDisplayName}
                  image={recipe.authorProfileImage}
                  size={36}
                />
                <div>
                  <Text fw={600}>{recipe.authorDisplayName}</Text>
                  <Text fz="sm">{dateFormatter.format(new Date(recipe.created))}</Text>
                </div>
              </Group>

              {recipe.tags.length > 0 ? (
                <Group gap={6}>
                  {recipe.tags.map((tag) => (
                    <TagBadge key={tag.id} tag={tag} />
                  ))}
                </Group>
              ) : null}

              <Text c="dimmed" className="recipe-detail-description">
                {recipe.description}
              </Text>
            </Stack>
          </Grid.Col>
        </Grid>
      </Card>

      <Card className="section-card recipe-mode-card" radius="xl" padding="xl">
        <Group justify="space-between" align="center" gap="lg">
          <div>
            <Text className="eyebrow">Rezeptmodus</Text>
            <Title order={3}>Display aktiv halten</Title>
            <Text c="dimmed" mt="xs" maw={620}>
              Ideal beim Kochen am Handy, damit das Display waehrend der Zubereitung nicht ausgeht.
            </Text>
            {recipeModeError ? (
              <Text c="red" fz="sm" mt="sm">
                {recipeModeError}
              </Text>
            ) : null}
          </div>

          <Switch
            size="lg"
            color="sage"
            checked={isRecipeModeEnabled}
            label={isRecipeModeEnabled ? "Aktiv" : "Aus"}
            onChange={async (event) => {
              const checked = event.currentTarget.checked;

              if (!checked) {
                setRecipeModeError(null);
                setIsRecipeModeEnabled(false);
                await releaseWakeLock(wakeLockRef);
                disableNoSleep(noSleepRef);
                return;
              }

              setRecipeModeError(null);

              const wakeLockEnabled = wakeLockSupported
                ? await requestWakeLock({
                    wakeLockRef,
                    onError: () => {
                      // Fallback handled below.
                    },
                    onSuccess: () => setRecipeModeError(null),
                  })
                : false;

              if (wakeLockEnabled) {
                setIsRecipeModeEnabled(true);
                return;
              }

              const noSleepEnabled = await enableNoSleep(noSleepRef);
              if (noSleepEnabled) {
                setIsRecipeModeEnabled(true);
                setRecipeModeError(null);
                return;
              }

              const message =
                "Der Rezeptmodus konnte auf diesem Geraet leider nicht aktiviert werden.";
              setRecipeModeError(message);
              setIsRecipeModeEnabled(false);
            }}
          />
        </Group>
      </Card>

      {macroItems.length > 0 ? (
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg">
          {macroItems.map((item) => (
            <Card key={item.label} className="section-card recipe-macro-card" radius="xl" padding="lg">
              <Group gap="sm" mb="md">
                <Tooltip label={item.label} withArrow>
                  <ThemeIcon size={40} radius="xl" color={item.color} variant="light">
                    <item.icon size={20} />
                  </ThemeIcon>
                </Tooltip>
                <Text fw={600}>{item.label}</Text>
              </Group>
              <Title order={3}>
                {item.value}
                {item.suffix ? ` ${item.suffix}` : ""}
              </Title>
            </Card>
          ))}
        </SimpleGrid>
      ) : null}

      <Card className="section-card" radius="xl" padding="xl">
        <Stack gap="md">
          <div>
            <Text className="eyebrow">Zutaten</Text>
            <Title order={3}>Das brauchst du</Title>
          </div>
          <List spacing="sm" size="md" center icon={<span className="recipe-list-dot" />}>
            {recipe.ingredients.map((ingredient, index) => (
              <List.Item key={`${ingredient.name}-${index}`}>
                {ingredient.amount != null && ingredient.unit
                  ? `${ingredient.amount} ${formatRecipeUnit(ingredient.unit)} ${ingredient.name}`
                  : ingredient.name}
              </List.Item>
            ))}
          </List>
        </Stack>
      </Card>

      <Card className="section-card" radius="xl" padding="xl">
        <Stack gap="md">
          <div>
            <Text className="eyebrow">Zubereitung</Text>
            <Title order={3}>So wird gekocht</Title>
          </div>
          <Text className="recipe-instructions">
            {recipe.instructions}
          </Text>
        </Stack>
      </Card>
    </Stack>
  );
}

async function requestWakeLock({
  wakeLockRef,
  onError,
  onSuccess,
}: {
  wakeLockRef: MutableRefObject<WakeLockSentinelLike | null>;
  onError: (message: string) => void;
  onSuccess: () => void;
}) {
  if (typeof document !== "undefined" && document.visibilityState !== "visible") {
    return false;
  }

  try {
    const wakeLock = await (navigator as WakeLockNavigator).wakeLock?.request("screen");
    if (!wakeLock) {
      onError("Der Rezeptmodus wird von diesem Browser nicht unterstuetzt.");
      return false;
    }

    wakeLockRef.current = wakeLock;
    wakeLock.addEventListener?.("release", () => {
      if (wakeLockRef.current === wakeLock) {
        wakeLockRef.current = null;
      }
    });
    onSuccess();
    return true;
  } catch {
    onError("Das Display konnte nicht aktiv gehalten werden. Bitte pruefe Browser- und Energiespareinstellungen.");
    return false;
  }
}

async function releaseWakeLock(wakeLockRef: MutableRefObject<WakeLockSentinelLike | null>) {
  if (!wakeLockRef.current) {
    return;
  }

  try {
    await wakeLockRef.current.release();
  } catch {
    // Ignore release errors when the browser already disposed the wake lock.
  } finally {
    wakeLockRef.current = null;
  }
}

async function enableNoSleep(noSleepRef: MutableRefObject<NoSleep | null>) {
  try {
    if (!noSleepRef.current) {
      noSleepRef.current = new NoSleep();
    }

    await noSleepRef.current.enable();
    return true;
  } catch {
    return false;
  }
}

function disableNoSleep(noSleepRef: MutableRefObject<NoSleep | null>) {
  try {
    noSleepRef.current?.disable();
  } catch {
    // Ignore fallback cleanup errors.
  }
}
