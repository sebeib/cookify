import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { NavLink as RouterNavLink, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ActionIcon,
  Button,
  Card,
  FileInput,
  Grid,
  Group,
  Image,
  NumberInput,
  Select,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useForm, type UseFormReturnType } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconLink,
  IconPhoto,
  IconPlus,
  IconTag,
  IconTrash,
} from "@tabler/icons-react";
import { createRecipe, getRecipe, getTags, importRecipe, isUnauthorizedError, updateRecipe } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { TagBadge } from "../recipe/TagBadge";
import { getPastelTagColor } from "../recipe/tagColor";
import { recipeUnitOptions } from "../recipe/units";
import type { CreateRecipePayload, ImportedRecipe, Recipe, RecipeUnit, Tag } from "../types";

type IngredientFormValue = {
  name: string;
  amount: string;
  unit: RecipeUnit | "";
};

type RecipeFormValues = {
  title: string;
  imageFile: File | null;
  imageUrl: string;
  description: string;
  instructions: string;
  ingredients: IngredientFormValue[];
  tags: string[];
  carbohydrates: string;
  protein: string;
  fat: string;
  kcal: string;
};

type RecipeEditorPageProps = {
  mode: "create" | "edit";
};

export function RecipeEditorPage({ mode }: RecipeEditorPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { sessionId, user } = useAuth();
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(mode === "edit");
  const [recipeLoadError, setRecipeLoadError] = useState<string | null>(null);
  const [loadedRecipe, setLoadedRecipe] = useState<Recipe | null>(null);
  const [tagSearch, setTagSearch] = useState("");
  const deferredTagSearch = useDeferredValue(tagSearch);
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);

  const form = useForm<RecipeFormValues>({
    initialValues: {
      title: "",
      imageFile: null,
      imageUrl: "",
      description: "",
      instructions: "",
      ingredients: [{ name: "", amount: "", unit: "" }],
      tags: [],
      carbohydrates: "",
      protein: "",
      fat: "",
      kcal: "",
    },
    validate: {
      title: (value) => (value.trim().length === 0 ? "Titel ist erforderlich." : null),
      description: (value) => (value.trim().length === 0 ? "Beschreibung ist erforderlich." : null),
      instructions: (value) => (value.trim().length === 0 ? "Kochanweisungen sind erforderlich." : null),
      ingredients: (value) => (value.length === 0 ? "Bitte mindestens eine Zutat angeben." : null),
    },
  });

  useEffect(() => {
    if (mode !== "edit") {
      return;
    }

    if (!id) {
      return;
    }

    let active = true;

    void (async () => {
      setIsLoadingRecipe(true);
      setRecipeLoadError(null);

      try {
        const recipe = await getRecipe(id, sessionId);
        if (!active) {
          return;
        }

        setLoadedRecipe(recipe);
        setTagSuggestions((current) => mergeTags(current, recipe.tags));
        form.setValues(mapRecipeToFormValues(recipe));
        setHasSubmitted(false);
      } catch (error) {
        if (!active || isUnauthorizedError(error)) {
          return;
        }

        setRecipeLoadError(
          error instanceof Error ? error.message : "Das Rezept konnte nicht geladen werden.",
        );
      } finally {
        if (active) {
          setIsLoadingRecipe(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [id, mode, sessionId]);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const tags = await getTags(sessionId, deferredTagSearch);
        if (active) {
          setTagSuggestions((current) => mergeTags(current, tags));
        }
      } catch (error) {
        if (isUnauthorizedError(error)) {
          return;
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [deferredTagSearch, sessionId]);

  const isOwnRecipe = loadedRecipe?.authorId === user?.id;
  const tagLookup = useMemo(
    () => new Map(tagSuggestions.map((tag) => [normalizeTagKey(tag.name), tag])),
    [tagSuggestions],
  );
  const selectedTagBadges = useMemo(
    () =>
      normalizeTagNames(form.values.tags).map((tagName) => {
        const existingTag = tagLookup.get(normalizeTagKey(tagName));

        return existingTag ?? {
          id: tagName,
          name: tagName,
          color: getPastelTagColor(tagName),
        };
      }),
    [form.values.tags, tagLookup],
  );

  if (mode === "edit" && !id) {
    return <Navigate to="/recipes" replace />;
  }

  if (mode === "edit" && isLoadingRecipe) {
    return (
      <Stack gap="xl" py="xl">
        <Card className="section-card" radius="xl" padding="xl">
          <Title order={3}>Rezept wird geladen...</Title>
        </Card>
      </Stack>
    );
  }

  if (mode === "edit" && recipeLoadError) {
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
            <Text c="dimmed">{recipeLoadError}</Text>
          </Stack>
        </Card>
      </Stack>
    );
  }

  if (mode === "edit" && loadedRecipe && !isOwnRecipe) {
    return (
      <Stack gap="xl" py="xl">
        <Button
          component={RouterNavLink}
          to={`/recipes/${loadedRecipe.id}`}
          variant="subtle"
          color="gray"
          leftSection={<IconArrowLeft size={16} />}
        >
          Zurueck zum Rezept
        </Button>

        <Card className="section-card" radius="xl" padding="xl">
          <Stack gap="sm">
            <Title order={3}>Bearbeitung nicht erlaubt</Title>
            <Text c="dimmed">Du kannst nur deine eigenen Rezepte bearbeiten.</Text>
          </Stack>
        </Card>
      </Stack>
    );
  }

  const pageTitle = mode === "edit" ? "Rezept bearbeiten" : "Neues Rezept anlegen";
  const pageDescription =
    mode === "edit"
      ? "Passe Zutaten, Kochanweisungen, Tags und Makros in Ruhe an."
      : "Erfasse zuerst nur das Wesentliche oder importiere ein Rezept direkt von einer Webseite mit `schema.org/Recipe`-Daten.";
  const cancelTarget =
    mode === "edit" && loadedRecipe ? `/recipes/${loadedRecipe.id}` : "/recipes";

  return (
    <Stack gap="xl" py="xl">
      <div className="section-heading">
        <Text className="eyebrow">Rezepte</Text>
        <Title order={2}>{pageTitle}</Title>
        <Text c="dimmed" mt="xs" maw={620}>
          {pageDescription}
        </Text>
      </div>

      <Card className="section-card recipe-import-card" radius="xl" padding="xl">
        <Stack gap="md">
          <div>
            <Title order={3}>Von Webseite importieren</Title>
            <Text c="dimmed" mt="xs" maw={620}>
              Aktuell werden nur Seiten unterstuetzt, die `schema.org/Recipe` per JSON-LD
              bereitstellen.
            </Text>
          </div>

          <Group align="flex-end" className="recipe-import-toolbar">
            <TextInput
              value={importUrl}
              onChange={(event) => setImportUrl(event.currentTarget.value)}
              label="Rezept-URL"
              placeholder="https://example.com/rezept"
              leftSection={<IconLink size={16} />}
              className="recipe-import-input"
            />
            <Button
              color="sage"
              loading={isImporting}
              onClick={async () => {
                if (!importUrl.trim()) {
                  notifications.show({
                    color: "red",
                    title: "URL fehlt",
                    message: "Bitte zuerst eine Rezept-URL eingeben.",
                  });
                  return;
                }

                setIsImporting(true);

                try {
                  const importedRecipe = await importRecipe(importUrl, sessionId);
                  applyImportedRecipe(form, importedRecipe);
                  notifications.show({
                    color: "sage",
                    title: "Rezept importiert",
                    message: "Die Rezeptdaten wurden in das Formular uebernommen.",
                  });
                } catch (error) {
                  if (isUnauthorizedError(error)) {
                    return;
                  }

                  const message =
                    error instanceof Error ? error.message : "Das Rezept konnte nicht importiert werden.";

                  notifications.show({
                    color: "red",
                    title: "Import fehlgeschlagen",
                    message,
                  });
                } finally {
                  setIsImporting(false);
                }
              }}
            >
              Rezeptdaten laden
            </Button>
          </Group>
        </Stack>
      </Card>

      <Card className="section-card recipe-form-card" radius="xl" padding="xl">
        <form
          onSubmit={form.onSubmit(async (values) => {
            setHasSubmitted(true);

            const payload = await buildCreateRecipePayload(values);
            if (!payload) {
              return;
            }

            setIsSaving(true);

            try {
              const recipe =
                mode === "edit" && id
                  ? await updateRecipe(id, payload, sessionId)
                  : await createRecipe(payload, sessionId);

              notifications.show({
                color: "sage",
                title: mode === "edit" ? "Rezept aktualisiert" : "Rezept erstellt",
                message:
                  mode === "edit"
                    ? `"${recipe.title}" wurde aktualisiert.`
                    : `"${recipe.title}" ist jetzt Teil deiner Sammlung.`,
              });
              void navigate(`/recipes/${recipe.id}`);
            } catch (error) {
              if (isUnauthorizedError(error)) {
                return;
              }

              const message =
                error instanceof Error
                  ? error.message
                  : mode === "edit"
                    ? "Das Rezept konnte nicht aktualisiert werden."
                    : "Das Rezept konnte nicht erstellt werden.";

              notifications.show({
                color: "red",
                title:
                  mode === "edit"
                    ? "Rezept konnte nicht aktualisiert werden"
                    : "Rezept konnte nicht erstellt werden",
                message,
              });
            } finally {
              setIsSaving(false);
            }
          })}
        >
          <Stack gap="xl">
            <Grid gap="lg">
              <Grid.Col span={{ base: 12, md: 7 }}>
                <TextInput
                  label="Titel"
                  placeholder="Cremige Tomatenpasta"
                  withAsterisk
                  {...form.getInputProps("title")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 5 }}>
                <FileInput
                  label="Bild"
                  placeholder="Optional"
                  accept="image/*"
                  clearable
                  leftSection={<IconPhoto size={16} />}
                  {...form.getInputProps("imageFile")}
                />
              </Grid.Col>
            </Grid>

            {form.values.imageUrl ? (
              <div className="recipe-import-preview">
                <Text fw={600} mb="sm">
                  Importiertes Bild
                </Text>
                <Image
                  src={form.values.imageUrl}
                  alt={form.values.title || "Importiertes Rezeptbild"}
                  radius="xl"
                  className="recipe-import-preview-image"
                />
              </div>
            ) : null}

            <Stack gap="sm">
              <div>
                <Text fw={600}>Tags</Text>
                <Text c="dimmed" fz="sm" mt={4}>
                  Vorhandene Tags werden vorgeschlagen. Neue Tags werden beim Speichern automatisch angelegt.
                </Text>
              </div>

              <TagsInput
                label="Rezept-Tags"
                placeholder="z. B. Pasta, Schnell, Feierabend"
                leftSection={<IconTag size={16} />}
                data={tagSuggestions.map((tag) => tag.name)}
                value={form.values.tags}
                searchValue={tagSearch}
                onSearchChange={setTagSearch}
                onChange={(value) => form.setFieldValue("tags", normalizeTagNames(value))}
                splitChars={[","]}
                clearable
              />

              {selectedTagBadges.length > 0 ? (
                <Group gap="xs">
                  {selectedTagBadges.map((tag) => (
                    <TagBadge key={tag.name} tag={tag} />
                  ))}
                </Group>
              ) : null}
            </Stack>

            <Textarea
              label="Beschreibung"
              placeholder="Beschreibe das Gericht, die Zubereitung und warum es sich zu kochen lohnt."
              minRows={4}
              autosize
              withAsterisk
              {...form.getInputProps("description")}
            />

            <Textarea
              label="Kochanweisungen"
              placeholder="Beschreibe Schritt fuer Schritt, wie das Rezept zubereitet wird."
              minRows={8}
              autosize
              withAsterisk
              {...form.getInputProps("instructions")}
            />

            <Stack gap="sm">
              <Group justify="space-between" align="flex-end">
                <div>
                  <Text fw={600}>Zutaten</Text>
                  <Text c="dimmed" fz="sm">
                    Verwende eine standardisierte Einheit, sobald du eine Menge angibst.
                  </Text>
                </div>
                <Button
                  type="button"
                  variant="light"
                  color="sage"
                  leftSection={<IconPlus size={16} />}
                  onClick={() =>
                    form.insertListItem("ingredients", { name: "", amount: "", unit: "" })
                  }
                >
                  Zutat hinzufuegen
                </Button>
              </Group>

              {typeof form.errors.ingredients === "string" ? (
                <Text c="red" fz="sm">
                  {form.errors.ingredients}
                </Text>
              ) : null}

              <Stack gap="sm">
                {form.values.ingredients.map((ingredient, index) => {
                  const missingName = hasSubmitted && ingredient.name.trim().length === 0;
                  const invalidAmountUnitPair =
                    hasSubmitted &&
                    ((ingredient.amount.trim().length > 0 && ingredient.unit === "") ||
                      (ingredient.amount.trim().length === 0 && ingredient.unit !== ""));

                  return (
                    <Card key={index} radius="lg" padding="md" className="recipe-ingredient-row">
                      <Grid gap="sm" align="flex-end">
                        <Grid.Col span={{ base: 12, md: 5 }}>
                          <TextInput
                            label="Zutat"
                            placeholder="Kirschtomaten"
                            value={ingredient.name}
                            error={missingName ? "Name der Zutat ist erforderlich." : undefined}
                            onChange={(event) =>
                              form.setFieldValue(
                                `ingredients.${index}.name`,
                                event.currentTarget.value,
                              )
                            }
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 4, md: 2 }}>
                          <NumberInput
                            label="Menge"
                            placeholder="250"
                            min={0}
                            decimalScale={2}
                            value={ingredient.amount === "" ? "" : Number(ingredient.amount)}
                            error={
                              invalidAmountUnitPair
                                ? "Menge und Einheit gemeinsam angeben."
                                : undefined
                            }
                            onChange={(value) =>
                              form.setFieldValue(
                                `ingredients.${index}.amount`,
                                value === "" || value == null ? "" : String(value),
                              )
                            }
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                          <Select
                            label="Einheit"
                            placeholder="Optional"
                            data={recipeUnitOptions}
                            value={ingredient.unit}
                            error={
                              invalidAmountUnitPair
                                ? "Menge und Einheit gemeinsam angeben."
                                : undefined
                            }
                            onChange={(value) =>
                              form.setFieldValue(
                                `ingredients.${index}.unit`,
                                (value as RecipeUnit | null) ?? "",
                              )
                            }
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 2, md: 2 }}>
                          <Group justify="flex-end">
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="lg"
                              disabled={form.values.ingredients.length === 1}
                              onClick={() => form.removeListItem("ingredients", index)}
                            >
                              <IconTrash size={18} />
                            </ActionIcon>
                          </Group>
                        </Grid.Col>
                      </Grid>
                    </Card>
                  );
                })}
              </Stack>
            </Stack>

            <div>
              <Text fw={600}>Makronaehrstoffe</Text>
              <Text c="dimmed" fz="sm" mt={4}>
                Optionale Angaben pro Rezept.
              </Text>
            </div>

            <Grid gap="lg">
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <NumberInput
                  label="Kohlenhydrate"
                  placeholder="0"
                  min={0}
                  decimalScale={2}
                  suffix=" g"
                  value={form.values.carbohydrates === "" ? "" : Number(form.values.carbohydrates)}
                  onChange={(value) =>
                    form.setFieldValue(
                      "carbohydrates",
                      value === "" || value == null ? "" : String(value),
                    )
                  }
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <NumberInput
                  label="Protein"
                  placeholder="0"
                  min={0}
                  decimalScale={2}
                  suffix=" g"
                  value={form.values.protein === "" ? "" : Number(form.values.protein)}
                  onChange={(value) =>
                    form.setFieldValue("protein", value === "" || value == null ? "" : String(value))
                  }
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <NumberInput
                  label="Fett"
                  placeholder="0"
                  min={0}
                  decimalScale={2}
                  suffix=" g"
                  value={form.values.fat === "" ? "" : Number(form.values.fat)}
                  onChange={(value) =>
                    form.setFieldValue("fat", value === "" || value == null ? "" : String(value))
                  }
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <NumberInput
                  label="Kcal"
                  placeholder="0"
                  min={0}
                  value={form.values.kcal === "" ? "" : Number(form.values.kcal)}
                  onChange={(value) =>
                    form.setFieldValue("kcal", value === "" || value == null ? "" : String(value))
                  }
                />
              </Grid.Col>
            </Grid>

            <Group justify="space-between">
              <Button
                type="button"
                variant="subtle"
                color="gray"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => void navigate(cancelTarget)}
              >
                Abbrechen
              </Button>
              <Button type="submit" color="sage" loading={isSaving}>
                {mode === "edit" ? "Aenderungen speichern" : "Rezept speichern"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}

function mapRecipeToFormValues(recipe: Recipe): RecipeFormValues {
  return {
    title: recipe.title,
    imageFile: null,
    imageUrl: recipe.image ?? "",
    description: recipe.description,
    instructions: recipe.instructions,
    ingredients:
      recipe.ingredients.length > 0
        ? recipe.ingredients.map((ingredient) => ({
            name: ingredient.name,
            amount: ingredient.amount == null ? "" : String(ingredient.amount),
            unit: ingredient.unit ?? "",
          }))
        : [{ name: "", amount: "", unit: "" }],
    tags: recipe.tags.map((tag) => tag.name),
    carbohydrates: recipe.carbohydrates == null ? "" : String(recipe.carbohydrates),
    protein: recipe.protein == null ? "" : String(recipe.protein),
    fat: recipe.fat == null ? "" : String(recipe.fat),
    kcal: recipe.kcal == null ? "" : String(recipe.kcal),
  };
}

function applyImportedRecipe(
  form: UseFormReturnType<RecipeFormValues>,
  importedRecipe: ImportedRecipe,
) {
  form.setValues({
    title: importedRecipe.title,
    imageFile: null,
    imageUrl: importedRecipe.image ?? "",
    description: importedRecipe.description,
    instructions: importedRecipe.instructions,
    ingredients:
      importedRecipe.ingredients.length > 0
        ? importedRecipe.ingredients.map((ingredient) => ({
            name: ingredient.name,
            amount: ingredient.amount == null ? "" : String(ingredient.amount),
            unit: ingredient.unit ?? "",
          }))
        : [{ name: "", amount: "", unit: "" }],
    tags: [],
    carbohydrates:
      importedRecipe.carbohydrates == null ? "" : String(importedRecipe.carbohydrates),
    protein: importedRecipe.protein == null ? "" : String(importedRecipe.protein),
    fat: importedRecipe.fat == null ? "" : String(importedRecipe.fat),
    kcal: importedRecipe.kcal == null ? "" : String(importedRecipe.kcal),
  });
}

async function buildCreateRecipePayload(
  values: RecipeFormValues,
): Promise<CreateRecipePayload | null> {
  const normalizedIngredients = values.ingredients.map((ingredient, index) => {
    const name = ingredient.name.trim();
    const hasAmount = ingredient.amount.trim().length > 0;
    const hasUnit = ingredient.unit !== "";

    if (name.length === 0) {
      notifications.show({
        color: "red",
        title: "Zutat unvollstaendig",
        message: `Zutat ${index + 1} braucht einen Namen.`,
      });
      return null;
    }

    if (hasAmount !== hasUnit) {
      notifications.show({
        color: "red",
        title: "Zutat unvollstaendig",
        message: `Zutat ${index + 1} braucht Menge und Einheit zusammen.`,
      });
      return null;
    }

    return {
      name,
      amount: hasAmount ? Number(ingredient.amount) : null,
      unit: hasUnit ? ingredient.unit : null,
    };
  });

  if (normalizedIngredients.some((ingredient) => ingredient == null)) {
    return null;
  }

  const ingredients = normalizedIngredients.filter(
    (ingredient): ingredient is CreateRecipePayload["ingredients"][number] => ingredient != null,
  );

  return {
    title: values.title.trim(),
    image: values.imageFile
      ? await fileToDataUrl(values.imageFile)
      : values.imageUrl.trim() || null,
    description: values.description.trim(),
    instructions: values.instructions.trim(),
    ingredients,
    tags: normalizeTagNames(values.tags),
    carbohydrates: parseOptionalNumber(values.carbohydrates),
    protein: parseOptionalNumber(values.protein),
    fat: parseOptionalNumber(values.fat),
    kcal: parseOptionalInteger(values.kcal),
  };
}

function normalizeTagNames(values: string[]) {
  const normalizedTags = new Map<string, string>();

  for (const value of values) {
    const normalizedValue = value.trim().replace(/\s+/g, " ");
    if (!normalizedValue) {
      continue;
    }

    const key = normalizeTagKey(normalizedValue);
    if (!normalizedTags.has(key)) {
      normalizedTags.set(key, normalizedValue);
    }
  }

  return [...normalizedTags.values()];
}

function normalizeTagKey(value: string) {
  return value.trim().toLowerCase();
}

function mergeTags(currentTags: Tag[], newTags: Tag[]) {
  const tagMap = new Map<string, Tag>();

  for (const tag of [...currentTags, ...newTags]) {
    tagMap.set(normalizeTagKey(tag.name), tag);
  }

  return [...tagMap.values()].sort((left, right) => left.name.localeCompare(right.name, "de"));
}

function parseOptionalNumber(value: string) {
  return value.trim().length === 0 ? null : Number(value);
}

function parseOptionalInteger(value: string) {
  return value.trim().length === 0 ? null : Math.round(Number(value));
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Das ausgewaehlte Bild konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}
