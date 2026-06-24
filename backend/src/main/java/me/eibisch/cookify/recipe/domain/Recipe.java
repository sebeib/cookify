package me.eibisch.cookify.recipe.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record Recipe(
        UUID id,
        String title,
        String image,
        List<RecipeIngredient> ingredients,
        String description,
        String instructions,
        BigDecimal carbohydrates,
        BigDecimal protein,
        BigDecimal fat,
        Integer kcal,
        UUID authorId,
        String authorDisplayName,
        Instant created
) {
}
