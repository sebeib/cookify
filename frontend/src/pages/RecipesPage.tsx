import { useDeferredValue, useEffect, useState } from "react";
import { NavLink as RouterNavLink, useSearchParams } from "react-router-dom";
import {
  Button,
  Card,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { IconChefHat, IconPhoto, IconPlus, IconSearch } from "@tabler/icons-react";
import { getRecipes, isUnauthorizedError } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { UserAvatar } from "../components/UserAvatar";
import { recipeMacroItems } from "../recipe/macro";
import { TagBadge } from "../recipe/TagBadge";
import type { RecipeCard } from "../types";

const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

export function RecipesPage() {
  const { sessionId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const deferredQuery = useDeferredValue(query);
  const [recipes, setRecipes] = useState<RecipeCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const nextQuery = searchParams.get("query") ?? "";
    setQuery((currentQuery) => (currentQuery === nextQuery ? currentQuery : nextQuery));
  }, [searchParams]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    const currentQuery = searchParams.get("query") ?? "";

    if (normalizedQuery === currentQuery) {
      return;
    }

    if (!normalizedQuery && !currentQuery) {
      return;
    }

    if (normalizedQuery) {
      setSearchParams({ query: normalizedQuery }, { replace: true });
      return;
    }

    setSearchParams({}, { replace: true });
  }, [query, searchParams, setSearchParams]);

  useEffect(() => {
    let active = true;

    void (async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextRecipes = await getRecipes(sessionId, deferredQuery);
        if (active) {
          setRecipes(nextRecipes);
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
  }, [deferredQuery, sessionId]);

  return (
    <Stack gap="xl" py="xl">
      <Group justify="space-between" align="flex-end" className="recipe-page-toolbar">
        <div className="section-heading">
          <Text className="eyebrow">Rezepte</Text>
          <Title order={2}>Dein Rezeptregal</Title>
          <Text c="dimmed" mt="xs" maw={620}>
            Lege eigene Gerichte an, halte Zutaten strukturiert fest und finde deine Lieblingsrezepte
            jederzeit wieder.
          </Text>
        </div>

        <Button
          component={RouterNavLink}
          to="/recipes/new"
          color="sage"
          leftSection={<IconPlus size={18} />}
        >
          Rezept anlegen
        </Button>
      </Group>

      <TextInput
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder="Rezepte, Zutaten oder Autoren suchen"
        leftSection={<IconSearch size={16} />}
        className="recipe-search-input"
      />

      {errorMessage ? (
        <Card className="section-card" radius="xl" padding="xl">
          <Stack gap="sm">
            <Title order={3}>Rezepte konnten nicht geladen werden</Title>
            <Text c="dimmed">{errorMessage}</Text>
          </Stack>
        </Card>
      ) : null}

      {!errorMessage && isLoading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="recipe-tile" radius="xl" padding="md">
              <div className="recipe-tile-image recipe-cover-sage" />
              <Stack gap="xs" mt="md">
                <Title order={4}>Rezept wird geladen...</Title>
                <Text c="dimmed">Einen kleinen Moment bitte.</Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      ) : null}

      {!errorMessage && !isLoading && recipes.length === 0 ? (
        <Card className="section-card recipe-empty-state" radius="xl" padding="xl">
          <Stack gap="md" align="flex-start">
            <ThemeIcon size={48} radius="xl" color="sage" variant="light">
              <IconChefHat size={24} />
            </ThemeIcon>
            <div>
              <Title order={3}>
                {deferredQuery.trim() ? "Keine passenden Rezepte" : "Noch keine Rezepte"}
              </Title>
              <Text c="dimmed" mt="xs" maw={540}>
                {deferredQuery.trim()
                  ? "Versuche einen anderen Suchbegriff oder lege ein neues Rezept an."
                  : "Starte deine Sammlung mit dem ersten Rezept. Titel, Zutatenliste und Beschreibung reichen schon aus."}
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

      {!errorMessage && !isLoading && recipes.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
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
                          onClick={() => setQuery(tag.name)}
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
      ) : null}
    </Stack>
  );
}
