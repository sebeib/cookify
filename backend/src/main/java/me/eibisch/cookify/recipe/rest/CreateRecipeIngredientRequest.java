package me.eibisch.cookify.recipe.rest;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record CreateRecipeIngredientRequest(
        @NotBlank String name,
        BigDecimal amount,
        String unit
) {
}
