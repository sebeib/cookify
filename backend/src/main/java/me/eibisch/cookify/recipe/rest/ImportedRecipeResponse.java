package me.eibisch.cookify.recipe.rest;

import java.math.BigDecimal;
import java.util.List;

public record ImportedRecipeResponse(
        String title,
        String image,
        List<RecipeIngredientResponse> ingredients,
        String description,
        String instructions,
        BigDecimal carbohydrates,
        BigDecimal protein,
        BigDecimal fat,
        Integer kcal
) {
}
