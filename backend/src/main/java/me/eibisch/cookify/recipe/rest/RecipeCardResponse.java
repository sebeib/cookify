package me.eibisch.cookify.recipe.rest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import me.eibisch.cookify.recipe.domain.Recipe;
import me.eibisch.cookify.tag.rest.TagResponse;

public record RecipeCardResponse(
        UUID id,
        String title,
        String image,
        List<TagResponse> tags,
        BigDecimal carbohydrates,
        BigDecimal protein,
        BigDecimal fat,
        Integer kcal,
        String authorDisplayName,
        String authorProfileImage,
        Instant created
) {
    public static RecipeCardResponse from(Recipe recipe) {
        return new RecipeCardResponse(
                recipe.id(),
                recipe.title(),
                recipe.image(),
                recipe.tags().stream()
                        .map(TagResponse::from)
                        .toList(),
                recipe.carbohydrates(),
                recipe.protein(),
                recipe.fat(),
                recipe.kcal(),
                recipe.authorDisplayName(),
                recipe.authorProfileImage(),
                recipe.created()
        );
    }
}
