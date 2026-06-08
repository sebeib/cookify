import { Card, Stack, Text, Title } from "@mantine/core";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PlaceholderPage({ eyebrow, title, description }: PlaceholderPageProps) {
  return (
    <Card radius="xl" padding="xl" withBorder>
      <Stack gap="sm">
        <Text c="dimmed" fz="sm" fw={700} tt="uppercase">
          {eyebrow}
        </Text>
        <Title order={2}>{title}</Title>
        <Text c="dimmed" maw={620}>
          {description}
        </Text>
      </Stack>
    </Card>
  );
}
