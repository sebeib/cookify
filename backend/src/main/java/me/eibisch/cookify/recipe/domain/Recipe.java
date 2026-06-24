package me.eibisch.cookify.recipe.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import me.eibisch.cookify.tag.domain.Tag;

public record Recipe(
        UUID id,
        String title,
        String image,
        List<RecipeIngredient> ingredients,
        List<Tag> tags,
        String description,
        String instructions,
        BigDecimal carbohydrates,
        BigDecimal protein,
        BigDecimal fat,
        Integer kcal,
        UUID authorId,
        String authorDisplayName,
        String authorProfileImage,
        Instant created
) {
}
