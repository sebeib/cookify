package me.eibisch.cookify.role;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Optional;
import java.util.UUID;
import org.jdbi.v3.core.Jdbi;

@ApplicationScoped
public class RoleRepository {

    private final Jdbi jdbi;

    @Inject
    public RoleRepository(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    public boolean existsById(UUID id) {
        return jdbi.withHandle(handle -> handle.createQuery("""
                        select exists(
                            select 1
                            from role
                            where id = :id
                        )
                        """)
                .bind("id", id)
                .mapTo(Boolean.class)
                .one());
    }

    public Optional<UUID> findIdByName(String name) {
        return jdbi.withHandle(handle -> handle.createQuery("""
                        select id
                        from role
                        where name = :name
                        """)
                .bind("name", name)
                .mapTo(UUID.class)
                .findOne());
    }
}
