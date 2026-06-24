package me.eibisch.cookify.recipe.rest;

import java.math.BigDecimal;
import me.eibisch.cookify.recipe.domain.RecipeIngredient;

public record RecipeIngredientResponse(
        String name,
        BigDecimal amount,
        String unit
) {
    public static RecipeIngredientResponse from(RecipeIngredient ingredient) {
        return new RecipeIngredientResponse(
                ingredient.name(),
                ingredient.amount(),
                ingredient.unit() == null ? null : ingredient.unit().name()
        );
    }
}
