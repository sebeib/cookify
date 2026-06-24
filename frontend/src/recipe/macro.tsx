import { IconBolt, IconChefHat, IconFlame, IconWheat } from "@tabler/icons-react";

export const recipeMacroItems = [
  {
    key: "carbohydrates",
    label: "Kohlenhydrate",
    suffix: "g",
    color: "yellow",
    icon: IconWheat,
  },
  {
    key: "protein",
    label: "Protein",
    suffix: "g",
    color: "blue",
    icon: IconChefHat,
  },
  {
    key: "fat",
    label: "Fett",
    suffix: "g",
    color: "pink",
    icon: IconBolt,
  },
  {
    key: "kcal",
    label: "Kalorien",
    suffix: "",
    color: "orange",
    icon: IconFlame,
  },
] as const;
