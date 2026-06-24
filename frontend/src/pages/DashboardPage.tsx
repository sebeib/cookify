import { useEffect, useState } from "react";
import { NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconChefHat, IconPhoto, IconPlus } from "@tabler/icons-react";
import { getRecipes, isUnauthorizedError } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { UserAvatar } from "../components/UserAvatar";
import { recipeMacroItems } from "../recipe/macro";
import { TagBadge } from "../recipe/TagBadge";
import type { RecipeCard } from "../types";

const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

export function DashboardPage() {
  const navigate = useNavigate();
  const { sessionId, user } = useAuth();
  const [recipes, setRecipes] = useState<RecipeCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const allRecipes = await getRecipes(sessionId);
        if (active) {
          setRecipes(selectRandomRecipes(allRecipes, 3));
        }
      } catch (error) {
        if (!active || isUnauthorizedError(error)) {
          return;
        }

        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : "Die Rezepte konnten nicht geladen werden.",
          );
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
  }, [sessionId]);

  return (
    <Stack gap="xl" py="xl">
      <Card className="landing-hero" radius="xl" padding="xl">
        <Stack gap="sm">
          <Text className="eyebrow">Willkommen zurueck</Text>
          <Title order={1} className="landing-title">
            Finde heute etwas Gutes zum Kochen, {user?.displayName}.
          </Title>
        </Stack>
      </Card>

      {!errorMessage && !isLoading && recipes.length > 0 ? (
        <>
          <div className="section-heading">
            <Text className="eyebrow">Ausgewaehlte Rezepte</Text>
            <Title order={2}>Ein paar entspannte Ideen zum Start</Title>
          </div>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            {recipes.map((recipe) => (
              <UnstyledButton
                key={recipe.id}
                component={RouterNavLink}
                to={`/recipes/${recipe.id}`}
                className="recipe-tile-link"
              >
                <Card className="recipe-tile" radius="xl" padding="md">
                  {recipe.image ? (
                    <Image
                      src={recipe.image}
                      alt={recipe.title}
                      className="recipe-tile-image"
                      radius="lg"
                    />
                  ) : (
                    <div className="recipe-tile-image recipe-tile-image-placeholder">
                      <ThemeIcon size={44} radius="xl" color="sage" variant="white">
                        <IconPhoto size={22} />
                      </ThemeIcon>
                    </div>
                  )}

                  <Stack gap="xs" mt="md">
                    <Title order={4}>{recipe.title}</Title>
                    <Group gap="sm" className="recipe-tile-meta" wrap="nowrap">
                      <UserAvatar
                        displayName={recipe.authorDisplayName}
                        image={recipe.authorProfileImage}
                        size={28}
                      />
                      <div>
                        <Text fz="sm" fw={600}>{recipe.authorDisplayName}</Text>
                        <Text fz="xs">{dateFormatter.format(new Date(recipe.created))}</Text>
                      </div>
                    </Group>
                    {recipe.tags.length > 0 ? (
                      <Group gap={6} mt={2}>
                        {recipe.tags.map((tag) => (
                          <TagBadge
                            key={tag.id}
                            tag={tag}
                            onClick={() =>
                              navigate(`/recipes?query=${encodeURIComponent(tag.name)}`)
                            }
                          />
                        ))}
                      </Group>
                    ) : null}
                    <Group gap="xs" mt="xs">
                      {recipeMacroItems.map((macro) => {
                        const value = recipe[macro.key];
                        if (value == null) {
                          return null;
                        }

                        return (
                          <Tooltip key={macro.key} label={macro.label} withArrow>
                            <div className="recipe-macro-chip">
                              <ThemeIcon size={28} radius="xl" color={macro.color} variant="light">
                                <macro.icon size={14} />
                              </ThemeIcon>
                              <Text fz="xs" fw={600} c="dark">
                                {value}
                                {macro.suffix ? ` ${macro.suffix}` : ""}
                              </Text>
                            </div>
                          </Tooltip>
                        );
                      })}
                    </Group>
                  </Stack>
                </Card>
              </UnstyledButton>
            ))}
          </SimpleGrid>
        </>
      ) : null}

      {!errorMessage && !isLoading && recipes.length === 0 ? (
        <Card className="section-card recipe-empty-state" radius="xl" padding="xl">
          <Stack gap="md" align="flex-start">
            <ThemeIcon size={48} radius="xl" color="sage" variant="light">
              <IconChefHat size={24} />
            </ThemeIcon>
            <div>
              <Title order={3}>Noch keine Rezepte</Title>
              <Text c="dimmed" mt="xs" maw={540}>
                Lege dein erstes Rezept an, dann erscheint hier automatisch eine zufaellige Auswahl.
              </Text>
            </div>
            <Button
              component={RouterNavLink}
              to="/recipes/new"
              color="sage"
              leftSection={<IconPlus size={18} />}
            >
              Erstes Rezept anlegen
            </Button>
          </Stack>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card className="section-card" radius="xl" padding="xl">
          <Stack gap="sm">
            <Title order={3}>Rezepte konnten nicht geladen werden</Title>
            <Text c="dimmed">{errorMessage}</Text>
          </Stack>
        </Card>
      ) : null}
    </Stack>
  );
}

function selectRandomRecipes(recipes: RecipeCard[], limit: number) {
  return [...recipes]
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}
