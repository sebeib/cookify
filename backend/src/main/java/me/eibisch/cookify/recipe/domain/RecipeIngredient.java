package me.eibisch.cookify.recipe.domain;

import java.math.BigDecimal;
import java.util.UUID;

public record RecipeIngredient(
        UUID id,
        int position,
        String name,
        BigDecimal amount,
        RecipeUnit unit
) {
}
