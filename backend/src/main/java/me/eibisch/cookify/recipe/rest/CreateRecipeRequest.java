package me.eibisch.cookify.recipe.rest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.math.BigDecimal;
import java.util.List;

public record CreateRecipeRequest(
        @NotBlank String title,
        String image,
        @NotEmpty List<@Valid CreateRecipeIngredientRequest> ingredients,
        @NotBlank String description,
        @NotBlank String instructions,
        BigDecimal carbohydrates,
        BigDecimal protein,
        BigDecimal fat,
        Integer kcal
) {
}
