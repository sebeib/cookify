package me.eibisch.cookify.recipe.repository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.eibisch.cookify.recipe.domain.Recipe;
import me.eibisch.cookify.recipe.domain.RecipeIngredient;
import me.eibisch.cookify.recipe.domain.RecipeUnit;
import me.eibisch.cookify.tag.domain.Tag;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.Jdbi;

@ApplicationScoped
public class RecipeRepository {

    private final Jdbi jdbi;

    @Inject
    public RecipeRepository(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    public List<Recipe> findAllCards() {
        return findAllCards(null);
    }

    public List<Recipe> findAllCards(String query) {
        return jdbi.withHandle(handle -> handle.createQuery("""
                        select r.id,
                               r.title,
                               r.image,
                               r.carbohydrates,
                               r.protein,
                               r.fat,
                               r.kcal,
                               r.created,
                               r.author_user_id,
                               u.display_name as author_display_name,
                               u.profile_image as author_profile_image
                        from recipe r
                        join user_account u on u.id = r.author_user_id
                        where (
                            :query is null
                            or lower(r.title) like :searchQuery
                            or lower(r.description) like :searchQuery
                            or lower(coalesce(r.instructions, '')) like :searchQuery
                            or lower(u.display_name) like :searchQuery
                            or exists(
                                select 1
                                from recipe_ingredient ri
                                where ri.recipe_id = r.id
                                  and lower(ri.name) like :searchQuery
                            )
                            or exists(
                                select 1
                                from recipe_tag rt
                                join tag t on t.id = rt.tag_id
                                where rt.recipe_id = r.id
                                  and lower(t.name) like :searchQuery
                            )
                        )
                        order by r.created desc
                        """)
                .bind("query", normalizeQuery(query))
                .bind("searchQuery", toSearchQuery(query))
                .map((rs, ctx) -> new Recipe(
                        rs.getObject("id", UUID.class),
                        rs.getString("title"),
                        rs.getString("image"),
                        List.of(),
                        findTags(handle, rs.getObject("id", UUID.class)),
                        null,
                        null,
                        rs.getBigDecimal("carbohydrates"),
                        rs.getBigDecimal("protein"),
                        rs.getBigDecimal("fat"),
                        readInteger(rs.getObject("kcal")),
                        rs.getObject("author_user_id", UUID.class),
                        rs.getString("author_display_name"),
                        rs.getString("author_profile_image"),
                        rs.getObject("created", OffsetDateTime.class).toInstant()))
                .list());
    }

    private String normalizeQuery(String query) {
        if (query == null) {
            return null;
        }

        String normalizedQuery = query.trim().toLowerCase();
        return normalizedQuery.isBlank() ? null : normalizedQuery;
    }

    private String toSearchQuery(String query) {
        String normalizedQuery = normalizeQuery(query);
        return normalizedQuery == null ? null : "%" + normalizedQuery + "%";
    }

    public Optional<Recipe> findById(UUID id) {
        return jdbi.withHandle(handle -> findById(handle, id));
    }

    public Optional<Recipe> create(Recipe recipe) {
        return jdbi.inTransaction(handle -> {
            insertRecipe(handle, recipe);
            insertIngredients(handle, recipe.id(), recipe.ingredients());
            insertTags(handle, recipe.id(), recipe.tags());

            return findById(handle, recipe.id());
        });
    }

    public Optional<Recipe> update(Recipe recipe) {
        return jdbi.inTransaction(handle -> {
            handle.createUpdate("""
                            update recipe
                            set title = :title,
                                image = :image,
                                description = :description,
                                instructions = :instructions,
                                carbohydrates = :carbohydrates,
                                protein = :protein,
                                fat = :fat,
                                kcal = :kcal
                            where id = :id
                            """)
                    .bind("id", recipe.id())
                    .bind("title", recipe.title())
                    .bind("image", recipe.image())
                    .bind("description", recipe.description())
                    .bind("instructions", recipe.instructions())
                    .bind("carbohydrates", recipe.carbohydrates())
                    .bind("protein", recipe.protein())
                    .bind("fat", recipe.fat())
                    .bind("kcal", recipe.kcal())
                    .execute();

            handle.createUpdate("delete from recipe_ingredient where recipe_id = :recipeId")
                    .bind("recipeId", recipe.id())
                    .execute();

            handle.createUpdate("delete from recipe_tag where recipe_id = :recipeId")
                    .bind("recipeId", recipe.id())
                    .execute();

            insertIngredients(handle, recipe.id(), recipe.ingredients());
            insertTags(handle, recipe.id(), recipe.tags());

            return findById(handle, recipe.id());
        });
    }

    private Optional<Recipe> findById(Handle handle, UUID id) {
        return handle.createQuery("""
                        select r.id,
                               r.title,
                               r.image,
                               r.description,
                               r.instructions,
                               r.carbohydrates,
                               r.protein,
                               r.fat,
                               r.kcal,
                               r.author_user_id,
                               r.created,
                               u.display_name as author_display_name,
                               u.profile_image as author_profile_image
                        from recipe r
                        join user_account u on u.id = r.author_user_id
                        where r.id = :id
                        """)
                .bind("id", id)
                .map((rs, ctx) -> new Recipe(
                        rs.getObject("id", UUID.class),
                        rs.getString("title"),
                        rs.getString("image"),
                        findIngredients(handle, rs.getObject("id", UUID.class)),
                        findTags(handle, rs.getObject("id", UUID.class)),
                        rs.getString("description"),
                        rs.getString("instructions"),
                        rs.getBigDecimal("carbohydrates"),
                        rs.getBigDecimal("protein"),
                        rs.getBigDecimal("fat"),
                        readInteger(rs.getObject("kcal")),
                        rs.getObject("author_user_id", UUID.class),
                        rs.getString("author_display_name"),
                        rs.getString("author_profile_image"),
                        rs.getObject("created", OffsetDateTime.class).toInstant()))
                .findOne();
    }

    private List<RecipeIngredient> findIngredients(Handle handle, UUID recipeId) {
        return handle.createQuery("""
                        select id, position, name, amount, unit
                        from recipe_ingredient
                        where recipe_id = :recipeId
                        order by position asc
                        """)
                .bind("recipeId", recipeId)
                .map((rs, ctx) -> new RecipeIngredient(
                        rs.getObject("id", UUID.class),
                        rs.getInt("position"),
                        rs.getString("name"),
                        rs.getBigDecimal("amount"),
                        mapUnit(rs.getString("unit"))))
                .list();
    }

    private List<Tag> findTags(Handle handle, UUID recipeId) {
        return handle.createQuery("""
                        select t.id, t.name, t.color
                        from recipe_tag rt
                        join tag t on t.id = rt.tag_id
                        where rt.recipe_id = :recipeId
                        order by lower(t.name) asc
                        """)
                .bind("recipeId", recipeId)
                .map((rs, ctx) -> new Tag(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getString("color")))
                .list();
    }

    private void insertRecipe(Handle handle, Recipe recipe) {
        handle.createUpdate("""
                        insert into recipe (
                            id,
                            title,
                            image,
                            description,
                            instructions,
                            carbohydrates,
                            protein,
                            fat,
                            kcal,
                            author_user_id,
                            created
                        )
                        values (
                            :id,
                            :title,
                            :image,
                            :description,
                            :instructions,
                            :carbohydrates,
                            :protein,
                            :fat,
                            :kcal,
                            :authorUserId,
                            :created
                        )
                        """)
                .bind("id", recipe.id())
                .bind("title", recipe.title())
                .bind("image", recipe.image())
                .bind("description", recipe.description())
                .bind("instructions", recipe.instructions())
                .bind("carbohydrates", recipe.carbohydrates())
                .bind("protein", recipe.protein())
                .bind("fat", recipe.fat())
                .bind("kcal", recipe.kcal())
                .bind("authorUserId", recipe.authorId())
                .bind("created", OffsetDateTime.ofInstant(recipe.created(), ZoneOffset.UTC))
                .execute();
    }

    private void insertIngredients(Handle handle, UUID recipeId, List<RecipeIngredient> ingredients) {
        for (RecipeIngredient ingredient : ingredients) {
            handle.createUpdate("""
                            insert into recipe_ingredient (
                                id,
                                recipe_id,
                                position,
                                name,
                                amount,
                                unit
                            )
                            values (
                                :id,
                                :recipeId,
                                :position,
                                :name,
                                :amount,
                                :unit
                            )
                            """)
                    .bind("id", ingredient.id())
                    .bind("recipeId", recipeId)
                    .bind("position", ingredient.position())
                    .bind("name", ingredient.name())
                    .bind("amount", ingredient.amount())
                    .bind("unit", ingredient.unit() == null ? null : ingredient.unit().name())
                    .execute();
        }
    }

    private void insertTags(Handle handle, UUID recipeId, List<Tag> tags) {
        for (Tag tag : tags) {
            handle.createUpdate("""
                            insert into recipe_tag (
                                recipe_id,
                                tag_id
                            )
                            values (
                                :recipeId,
                                :tagId
                            )
                            """)
                    .bind("recipeId", recipeId)
                    .bind("tagId", tag.id())
                    .execute();
        }
    }

    private RecipeUnit mapUnit(String unit) {
        if (unit == null || unit.isBlank()) {
            return null;
        }

        return RecipeUnit.from(unit);
    }

    private Integer readInteger(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Integer integer) {
            return integer;
        }

        if (value instanceof BigDecimal decimal) {
            return decimal.intValue();
        }

        return Integer.valueOf(value.toString());
    }
}
