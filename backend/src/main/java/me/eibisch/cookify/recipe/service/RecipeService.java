package me.eibisch.cookify.recipe.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import me.eibisch.cookify.api.ApiException;
import me.eibisch.cookify.recipe.domain.Recipe;
import me.eibisch.cookify.recipe.domain.RecipeIngredient;
import me.eibisch.cookify.recipe.domain.RecipeUnit;
import me.eibisch.cookify.recipe.repository.RecipeRepository;
import me.eibisch.cookify.recipe.rest.CreateRecipeIngredientRequest;
import me.eibisch.cookify.recipe.rest.CreateRecipeRequest;
import me.eibisch.cookify.recipe.rest.RecipeCardResponse;
import me.eibisch.cookify.recipe.rest.RecipeResponse;
import me.eibisch.cookify.user.domain.User;
import me.eibisch.cookify.user.repository.UserRepository;

@ApplicationScoped
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final UserRepository userRepository;

    @Inject
    public RecipeService(RecipeRepository recipeRepository, UserRepository userRepository) {
        this.recipeRepository = recipeRepository;
        this.userRepository = userRepository;
    }

    public List<RecipeCardResponse> findAllCards() {
        return findAllCards(null);
    }

    public List<RecipeCardResponse> findAllCards(String query) {
        return recipeRepository.findAllCards(query)
                .stream()
                .map(RecipeCardResponse::from)
                .toList();
    }

    public RecipeResponse findById(UUID id) {
        return recipeRepository.findById(id)
                .map(RecipeResponse::from)
                .orElseThrow(() -> new ApiException(Response.Status.NOT_FOUND, "Recipe %s was not found.".formatted(id)));
    }

    public RecipeResponse create(CreateRecipeRequest request, UUID authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ApiException(Response.Status.UNAUTHORIZED, "The session is invalid."));

        String normalizedTitle = request.title().trim();
        String normalizedDescription = request.description().trim();
        String normalizedImage = normalizeImage(request.image());

        validatePositive("carbohydrates", request.carbohydrates());
        validatePositive("protein", request.protein());
        validatePositive("fat", request.fat());
        validateKcal(request.kcal());

        List<RecipeIngredient> ingredients = mapIngredients(request.ingredients());

        Recipe recipe = new Recipe(
                UUID.randomUUID(),
                normalizedTitle,
                normalizedImage,
                ingredients,
                normalizedDescription,
                request.carbohydrates(),
                request.protein(),
                request.fat(),
                request.kcal(),
                author.id(),
                author.displayName(),
                Instant.now()
        );

        return recipeRepository.create(recipe)
                .map(RecipeResponse::from)
                .orElseThrow(() -> new ApiException(Response.Status.INTERNAL_SERVER_ERROR, "Recipe could not be created."));
    }

    private List<RecipeIngredient> mapIngredients(List<CreateRecipeIngredientRequest> ingredients) {
        return java.util.stream.IntStream.range(0, ingredients.size())
                .mapToObj(index -> mapIngredient(ingredients.get(index), index))
                .toList();
    }

    private RecipeIngredient mapIngredient(CreateRecipeIngredientRequest request, int position) {
        String normalizedName = request.name().trim();
        BigDecimal amount = request.amount();
        String rawUnit = request.unit() == null ? null : request.unit().trim();

        if (amount != null && amount.signum() <= 0) {
            throw new ApiException(Response.Status.BAD_REQUEST, "Ingredient amounts must be greater than zero.");
        }

        if ((amount == null) != (rawUnit == null || rawUnit.isBlank())) {
            throw new ApiException(Response.Status.BAD_REQUEST, "Ingredient amount and unit must either both be set or both be empty.");
        }

        RecipeUnit unit = null;
        if (rawUnit != null && !rawUnit.isBlank()) {
            try {
                unit = RecipeUnit.from(rawUnit);
            } catch (IllegalArgumentException exception) {
                throw new ApiException(Response.Status.BAD_REQUEST, "Unit '%s' is not supported.".formatted(rawUnit));
            }
        }

        return new RecipeIngredient(
                UUID.randomUUID(),
                position,
                normalizedName,
                amount,
                unit
        );
    }

    private String normalizeImage(String image) {
        if (image == null) {
            return null;
        }

        String normalizedImage = image.trim();
        return normalizedImage.isBlank() ? null : normalizedImage;
    }

    private void validatePositive(String fieldName, BigDecimal value) {
        if (value != null && value.signum() < 0) {
            throw new ApiException(Response.Status.BAD_REQUEST, "%s must not be negative.".formatted(fieldName));
        }
    }

    private void validateKcal(Integer kcal) {
        if (kcal != null && kcal < 0) {
            throw new ApiException(Response.Status.BAD_REQUEST, "kcal must not be negative.");
        }
    }
}
