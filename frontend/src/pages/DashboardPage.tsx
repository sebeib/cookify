import { Badge, Card, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import {
  IconBookmark,
  IconClock,
  IconFlame,
  IconLeaf,
  IconSoup,
  IconSparkles,
} from "@tabler/icons-react";
import { useAuth } from "../auth/AuthProvider";

const recipes = [
  {
    title: "Lemon ricotta pasta",
    time: "20 min",
    note: "Bright, soft and weeknight-friendly.",
    tone: "recipe-cover-sage",
    icon: IconLeaf,
  },
  {
    title: "Tomato butter beans",
    time: "25 min",
    note: "Comfort food with a pantry-first feel.",
    tone: "recipe-cover-apricot",
    icon: IconSoup,
  },
  {
    title: "Roasted peach toast",
    time: "15 min",
    note: "A small sweet breakfast with little effort.",
    tone: "recipe-cover-rose",
    icon: IconSparkles,
  },
];

const collections = [
  {
    title: "Quick dinners",
    description: "Simple dishes for evenings when you want something warm without too much planning.",
  },
  {
    title: "Slow weekend cooking",
    description: "A quieter shelf for baking, simmering and recipes you want to return to.",
  },
];

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <Stack gap="xl" py="xl">
      <Card className="landing-hero" radius="xl" padding="xl">
        <Stack gap="lg">
          <div>
            <Text className="eyebrow">Welcome back</Text>
            <Title order={1} className="landing-title">
              Find something good to cook today, {user?.displayName}.
            </Title>
            <Text className="landing-copy" mt="md">
              Cookify is shifting into a calmer recipe space: less control center, more collection,
              discovery and everyday inspiration.
            </Text>
          </div>

          <Group gap="sm">
            <Badge color="sage" variant="light" size="lg">
              Seasonal picks
            </Badge>
            <Badge color="sage" variant="light" size="lg">
              Everyday cooking
            </Badge>
            <Badge color="sage" variant="light" size="lg">
              Saved for later
            </Badge>
          </Group>
        </Stack>
      </Card>

      <div className="section-heading">
        <Text className="eyebrow">Featured recipes</Text>
        <Title order={2}>A few gentle starting points</Title>
      </div>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        {recipes.map((recipe) => (
          <Card key={recipe.title} className="recipe-card" radius="xl" padding="md">
            <div className={`recipe-cover ${recipe.tone}`}>
              <ThemeIcon radius="xl" size={44} color="sage" variant="white">
                <recipe.icon size={22} />
              </ThemeIcon>
            </div>
            <Stack gap="xs" mt="md">
              <Group justify="space-between" align="flex-start">
                <Title order={4}>{recipe.title}</Title>
                <Group gap={4} className="recipe-meta">
                  <IconClock size={14} />
                  <Text fz="sm">{recipe.time}</Text>
                </Group>
              </Group>
              <Text c="dimmed">{recipe.note}</Text>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        {collections.map((collection) => (
          <Card key={collection.title} className="collection-card" radius="xl" padding="xl">
            <Group justify="space-between" align="flex-start" mb="md">
              <div>
                <Text className="eyebrow">Collection</Text>
                <Title order={3} mt="xs">
                  {collection.title}
                </Title>
              </div>
              <ThemeIcon radius="xl" size={42} color="sage" variant="light">
                <IconBookmark size={20} />
              </ThemeIcon>
            </Group>
            <Text c="dimmed" maw={460}>
              {collection.description}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Card className="section-card" radius="xl" padding="xl">
          <Text className="eyebrow">From your kitchen</Text>
          <Title order={3} mt="xs">
            Keep the interface soft, keep the product close to cooking.
          </Title>
          <Text c="dimmed" mt="md">
            The authenticated shell is already working against your backend session model. From here
            we can grow recipe details, collections, search and cooking flows without keeping the
            admin-dashboard feel.
          </Text>
        </Card>

        <Card className="section-card" radius="xl" padding="xl">
          <Group gap="sm" mb="md">
            <ThemeIcon radius="xl" size={40} color="sage" variant="light">
              <IconFlame size={20} />
            </ThemeIcon>
            <div>
              <Text className="eyebrow">Current account</Text>
              <Title order={3}>{user?.username}</Title>
            </div>
          </Group>
          <Text c="dimmed">Your current session is active and ready for the next product steps.</Text>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
