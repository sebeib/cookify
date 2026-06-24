export type User = {
  id: string;
  username: string;
  displayName: string;
  created: string;
  roleId: string;
};

export type LoginResponse = {
  sessionId: string;
  user: User;
};

export type InviteResponse = {
  id: string;
  roleId: string;
};

export type RecipeUnit = "G" | "KG" | "ML" | "L" | "TL" | "EL" | "PCS" | "PINCH";

export type RecipeIngredient = {
  name: string;
  amount: number | null;
  unit: RecipeUnit | null;
};

export type RecipeCard = {
  id: string;
  title: string;
  image: string | null;
  carbohydrates: number | null;
  protein: number | null;
  fat: number | null;
  kcal: number | null;
  authorDisplayName: string;
  created: string;
};

export type Recipe = {
  id: string;
  title: string;
  image: string | null;
  ingredients: RecipeIngredient[];
  description: string;
  carbohydrates: number | null;
  protein: number | null;
  fat: number | null;
  kcal: number | null;
  authorId: string;
  authorDisplayName: string;
  created: string;
};

export type CreateRecipePayload = {
  title: string;
  image: string | null;
  ingredients: RecipeIngredient[];
  description: string;
  carbohydrates: number | null;
  protein: number | null;
  fat: number | null;
  kcal: number | null;
};
