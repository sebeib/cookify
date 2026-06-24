export type User = {
  id: string;
  username: string;
  displayName: string;
  profileImage: string | null;
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

export type Tag = {
  id: string;
  name: string;
  color: string;
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
  tags: Tag[];
  carbohydrates: number | null;
  protein: number | null;
  fat: number | null;
  kcal: number | null;
  authorDisplayName: string;
  authorProfileImage: string | null;
  created: string;
};

export type Recipe = {
  id: string;
  title: string;
  image: string | null;
  ingredients: RecipeIngredient[];
  tags: Tag[];
  description: string;
  instructions: string;
  carbohydrates: number | null;
  protein: number | null;
  fat: number | null;
  kcal: number | null;
  authorId: string;
  authorDisplayName: string;
  authorProfileImage: string | null;
  created: string;
};

export type CreateRecipePayload = {
  title: string;
  image: string | null;
  ingredients: RecipeIngredient[];
  tags: string[];
  description: string;
  instructions: string;
  carbohydrates: number | null;
  protein: number | null;
  fat: number | null;
  kcal: number | null;
};

export type ImportedRecipe = CreateRecipePayload;
