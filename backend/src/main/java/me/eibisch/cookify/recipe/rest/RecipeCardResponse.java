package me.eibisch.cookify.recipe.rest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import me.eibisch.cookify.recipe.domain.Recipe;

public record RecipeCardResponse(
        UUID id,
        String title,
        String image,
        BigDecimal carbohydrates,
        BigDecimal protein,
        BigDecimal fat,
        Integer kcal,
        String authorDisplayName,
        Instant created
) {
    public static RecipeCardResponse from(Recipe recipe) {
        return new RecipeCardResponse(
                recipe.id(),
                recipe.title(),
                recipe.image(),
                recipe.carbohydrates(),
                recipe.protein(),
                recipe.fat(),
                recipe.kcal(),
                recipe.authorDisplayName(),
                recipe.created()
        );
    }
}
