import { useEffect, useState } from "react";
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
  Text,
  ThemeIcon,
  Tooltip,
  Title,
} from "@mantine/core";
import { IconArrowLeft, IconPhoto } from "@tabler/icons-react";
import { getRecipe } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { recipeMacroItems } from "../recipe/macro";
import { formatRecipeUnit } from "../recipe/units";
import type { Recipe } from "../types";

const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { sessionId } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

              <Group gap="xs" className="recipe-tile-meta">
                <Text>{recipe.authorDisplayName}</Text>
                <span>•</span>
                <Text>{dateFormatter.format(new Date(recipe.created))}</Text>
              </Group>

              <Text c="dimmed" className="recipe-detail-description">
                {recipe.description}
              </Text>
            </Stack>
          </Grid.Col>
        </Grid>
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
