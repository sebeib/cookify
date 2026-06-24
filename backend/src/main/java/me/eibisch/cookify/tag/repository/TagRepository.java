package me.eibisch.cookify.tag.repository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import me.eibisch.cookify.tag.domain.Tag;
import org.jdbi.v3.core.Jdbi;

@ApplicationScoped
public class TagRepository {

    private final Jdbi jdbi;

    @Inject
    public TagRepository(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    public Optional<Tag> findByName(String name) {
        String normalizedName = normalizeName(name);
        if (normalizedName == null) {
            return Optional.empty();
        }

        return jdbi.withHandle(handle -> handle.createQuery("""
                        select id, name, color
                        from tag
                        where lower(name) = :name
                        """)
                .bind("name", normalizedName)
                .map((rs, ctx) -> new Tag(
                        rs.getObject("id", java.util.UUID.class),
                        rs.getString("name"),
                        rs.getString("color")))
                .findOne());
    }

    public Tag create(Tag tag) {
        return jdbi.withHandle(handle -> {
            handle.createUpdate("""
                            insert into tag (id, name, color)
                            values (:id, :name, :color)
                            """)
                    .bind("id", tag.id())
                    .bind("name", tag.name())
                    .bind("color", tag.color())
                    .execute();

            return tag;
        });
    }

    public List<Tag> findSuggestions(String query) {
        String normalizedQuery = normalizeName(query);
        String searchQuery = normalizedQuery == null ? null : "%" + normalizedQuery + "%";
        String prefixQuery = normalizedQuery == null ? null : normalizedQuery + "%";

        return jdbi.withHandle(handle -> handle.createQuery("""
                        select id, name, color
                        from tag
                        where :query is null
                           or lower(name) like :searchQuery
                        order by case
                                     when :query is not null and lower(name) like :prefixQuery then 0
                                     else 1
                                 end,
                                 lower(name) asc
                        limit 12
                        """)
                .bind("query", normalizedQuery)
                .bind("searchQuery", searchQuery)
                .bind("prefixQuery", prefixQuery)
                .map((rs, ctx) -> new Tag(
                        rs.getObject("id", java.util.UUID.class),
                        rs.getString("name"),
                        rs.getString("color")))
                .list());
    }

    private String normalizeName(String name) {
        if (name == null) {
            return null;
        }

        String normalizedName = name.trim().toLowerCase(Locale.ROOT);
        return normalizedName.isBlank() ? null : normalizedName;
    }
}
