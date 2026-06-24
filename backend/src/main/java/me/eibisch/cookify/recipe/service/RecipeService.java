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
import me.eibisch.cookify.tag.domain.Tag;
import me.eibisch.cookify.tag.service.TagService;
import me.eibisch.cookify.user.domain.User;
import me.eibisch.cookify.user.repository.UserRepository;

@ApplicationScoped
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final UserRepository userRepository;
    private final TagService tagService;

    @Inject
    public RecipeService(RecipeRepository recipeRepository, UserRepository userRepository, TagService tagService) {
        this.recipeRepository = recipeRepository;
        this.userRepository = userRepository;
        this.tagService = tagService;
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

        Recipe recipe = mapRecipeRequest(
                UUID.randomUUID(),
                request,
                author.id(),
                author.displayName(),
                author.profileImage(),
                Instant.now()
        );

        return recipeRepository.create(recipe)
                .map(RecipeResponse::from)
                .orElseThrow(() -> new ApiException(Response.Status.INTERNAL_SERVER_ERROR, "Recipe could not be created."));
    }

    public RecipeResponse update(UUID id, CreateRecipeRequest request, UUID currentUserId) {
        Recipe existingRecipe = recipeRepository.findById(id)
                .orElseThrow(() -> new ApiException(Response.Status.NOT_FOUND, "Recipe %s was not found.".formatted(id)));

        if (!existingRecipe.authorId().equals(currentUserId)) {
            throw new ApiException(Response.Status.FORBIDDEN, "You can only edit your own recipes.");
        }

        Recipe recipe = mapRecipeRequest(
                existingRecipe.id(),
                request,
                existingRecipe.authorId(),
                existingRecipe.authorDisplayName(),
                existingRecipe.authorProfileImage(),
                existingRecipe.created()
        );

        return recipeRepository.update(recipe)
                .map(RecipeResponse::from)
                .orElseThrow(() -> new ApiException(Response.Status.INTERNAL_SERVER_ERROR, "Recipe could not be updated."));
    }

    private Recipe mapRecipeRequest(
            UUID recipeId,
            CreateRecipeRequest request,
            UUID authorId,
            String authorDisplayName,
            String authorProfileImage,
            Instant created
    ) {
        String normalizedTitle = request.title().trim();
        String normalizedDescription = request.description().trim();
        String normalizedInstructions = request.instructions().trim();
        String normalizedImage = normalizeImage(request.image());

        validatePositive("carbohydrates", request.carbohydrates());
        validatePositive("protein", request.protein());
        validatePositive("fat", request.fat());
        validateKcal(request.kcal());

        List<RecipeIngredient> ingredients = mapIngredients(request.ingredients());
        List<Tag> tags = tagService.resolveTags(request.tags());

        return new Recipe(
                recipeId,
                normalizedTitle,
                normalizedImage,
                ingredients,
                tags,
                normalizedDescription,
                normalizedInstructions,
                request.carbohydrates(),
                request.protein(),
                request.fat(),
                request.kcal(),
                authorId,
                authorDisplayName,
                authorProfileImage,
                created
        );
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
