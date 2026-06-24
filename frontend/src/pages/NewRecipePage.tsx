import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useForm, type UseFormReturnType } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconLink, IconPhoto, IconPlus, IconTrash } from "@tabler/icons-react";
import { createRecipe, importRecipe } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { recipeUnitOptions } from "../recipe/units";
import type { CreateRecipePayload, ImportedRecipe, RecipeUnit } from "../types";

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
  carbohydrates: string;
  protein: string;
  fat: string;
  kcal: string;
};

export function NewRecipePage() {
  const navigate = useNavigate();
  const { sessionId } = useAuth();
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const form = useForm<RecipeFormValues>({
    initialValues: {
      title: "",
      imageFile: null,
      imageUrl: "",
      description: "",
      instructions: "",
      ingredients: [{ name: "", amount: "", unit: "" }],
      carbohydrates: "",
      protein: "",
      fat: "",
      kcal: "",
    },
    validate: {
      title: (value) => (value.trim().length === 0 ? "Titel ist erforderlich." : null),
      description: (value) => (value.trim().length === 0 ? "Beschreibung ist erforderlich." : null),
      instructions: (value) => (value.trim().length === 0 ? "Kochanweisungen sind erforderlich." : null),
      ingredients: (value) =>
        value.length === 0 ? "Bitte mindestens eine Zutat angeben." : null,
    },
  });

  return (
    <Stack gap="xl" py="xl">
      <div className="section-heading">
        <Text className="eyebrow">Rezepte</Text>
        <Title order={2}>Neues Rezept anlegen</Title>
        <Text c="dimmed" mt="xs" maw={620}>
          Erfasse zuerst nur das Wesentliche oder importiere ein Rezept direkt von einer Webseite
          mit `schema.org/Recipe`-Daten.
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
              const recipe = await createRecipe(payload, sessionId);
              notifications.show({
                color: "sage",
                title: "Rezept erstellt",
                message: `"${recipe.title}" ist jetzt Teil deiner Sammlung.`,
              });
              void navigate(`/recipes/${recipe.id}`);
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Das Rezept konnte nicht erstellt werden.";

              notifications.show({
                color: "red",
                title: "Rezept konnte nicht erstellt werden",
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
                    <Card
                      key={index}
                      radius="lg"
                      padding="md"
                      className="recipe-ingredient-row"
                    >
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
                            error={invalidAmountUnitPair ? "Menge und Einheit gemeinsam angeben." : undefined}
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
                            error={invalidAmountUnitPair ? "Menge und Einheit gemeinsam angeben." : undefined}
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
                onClick={() => void navigate("/recipes")}
              >
                Abbrechen
              </Button>
              <Button type="submit" color="sage" loading={isSaving}>
                Rezept speichern
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
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
    carbohydrates: parseOptionalNumber(values.carbohydrates),
    protein: parseOptionalNumber(values.protein),
    fat: parseOptionalNumber(values.fat),
    kcal: parseOptionalInteger(values.kcal),
  };
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
