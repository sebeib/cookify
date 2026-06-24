package me.eibisch.cookify.recipe.rest;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;
import me.eibisch.cookify.recipe.service.RecipeImportService;
import me.eibisch.cookify.recipe.service.RecipeService;

@Path("/api/recipe")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class RecipeResource {

    private final RecipeService recipeService;
    private final RecipeImportService recipeImportService;

    @Inject
    public RecipeResource(RecipeService recipeService, RecipeImportService recipeImportService) {
        this.recipeService = recipeService;
        this.recipeImportService = recipeImportService;
    }

    @GET
    public List<RecipeCardResponse> getRecipes(@QueryParam("query") String query) {
        return recipeService.findAllCards(query);
    }

    @GET
    @Path("/{id}")
    public RecipeResponse getRecipe(@PathParam("id") UUID id) {
        return recipeService.findById(id);
    }

    @POST
    public Response createRecipe(@Valid CreateRecipeRequest request, @Context ContainerRequestContext requestContext) {
        UUID authorId = (UUID) requestContext.getProperty("authenticatedUserId");
        RecipeResponse recipe = recipeService.create(request, authorId);
        return Response.status(Response.Status.CREATED)
                .entity(recipe)
                .build();
    }

    @PUT
    @Path("/{id}")
    public RecipeResponse updateRecipe(
            @PathParam("id") UUID id,
            @Valid CreateRecipeRequest request,
            @Context ContainerRequestContext requestContext
    ) {
        UUID currentUserId = (UUID) requestContext.getProperty("authenticatedUserId");
        return recipeService.update(id, request, currentUserId);
    }

    @POST
    @Path("/import")
    public ImportedRecipeResponse importRecipe(@Valid ImportRecipeRequest request) {
        return recipeImportService.importFromUrl(request.url());
    }
}
