import type { RecipeUnit } from "../types";

export const recipeUnitOptions: Array<{ value: RecipeUnit; label: string }> = [
  { value: "G", label: "g" },
  { value: "KG", label: "kg" },
  { value: "ML", label: "ml" },
  { value: "L", label: "l" },
  { value: "TL", label: "TL" },
  { value: "EL", label: "EL" },
  { value: "PCS", label: "pcs" },
  { value: "PINCH", label: "pinch" },
];

export function formatRecipeUnit(unit: RecipeUnit) {
  return recipeUnitOptions.find((option) => option.value === unit)?.label ?? unit;
}
