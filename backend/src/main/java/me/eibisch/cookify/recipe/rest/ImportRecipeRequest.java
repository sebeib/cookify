package me.eibisch.cookify.recipe.rest;

import jakarta.validation.constraints.NotBlank;

public record ImportRecipeRequest(
        @NotBlank String url
) {
}
