package me.eibisch.cookify.recipe.rest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import me.eibisch.cookify.recipe.domain.Recipe;

public record RecipeResponse(
        UUID id,
        String title,
        String image,
        List<RecipeIngredientResponse> ingredients,
        String description,
        BigDecimal carbohydrates,
        BigDecimal protein,
        BigDecimal fat,
        Integer kcal,
        UUID authorId,
        String authorDisplayName,
        Instant created
) {
    public static RecipeResponse from(Recipe recipe) {
        return new RecipeResponse(
                recipe.id(),
                recipe.title(),
                recipe.image(),
                recipe.ingredients().stream()
                        .map(RecipeIngredientResponse::from)
                        .toList(),
                recipe.description(),
                recipe.carbohydrates(),
                recipe.protein(),
                recipe.fat(),
                recipe.kcal(),
                recipe.authorId(),
                recipe.authorDisplayName(),
                recipe.created()
        );
    }
}
