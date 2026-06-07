package me.eibisch.cookify.user.repository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.eibisch.cookify.user.domain.User;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.statement.StatementContext;

@ApplicationScoped
public class UserRepository {

    private final Jdbi jdbi;

    @Inject
    public UserRepository(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    public List<User> findAll() {
        return jdbi.withHandle(handle -> handle.createQuery("""
                        select id, username, password, display_name, created, role_id
                        from user_account
                        order by username asc
                        """)
                .map((rs, ctx) -> mapUser(
                        rs.getObject("id", UUID.class),
                        rs.getString("username"),
                        rs.getString("password"),
                        rs.getString("display_name"),
                        rs.getObject("created", OffsetDateTime.class).toInstant(),
                        rs.getObject("role_id", UUID.class),
                        ctx))
                .list());
    }

    public Optional<User> findById(UUID id) {
        return jdbi.withHandle(handle -> handle.createQuery("""
                        select id, username, password, display_name, created, role_id
                        from user_account
                        where id = :id
                        """)
                .bind("id", id)
                .map((rs, ctx) -> mapUser(
                        rs.getObject("id", UUID.class),
                        rs.getString("username"),
                        rs.getString("password"),
                        rs.getString("display_name"),
                        rs.getObject("created", OffsetDateTime.class).toInstant(),
                        rs.getObject("role_id", UUID.class),
                        ctx))
                .findOne());
    }

    public Optional<User> findByUsername(String username) {
        return jdbi.withHandle(handle -> handle.createQuery("""
                        select id, username, password, display_name, created, role_id
                        from user_account
                        where username = :username
                        """)
                .bind("username", username)
                .map((rs, ctx) -> mapUser(
                        rs.getObject("id", UUID.class),
                        rs.getString("username"),
                        rs.getString("password"),
                        rs.getString("display_name"),
                        rs.getObject("created", OffsetDateTime.class).toInstant(),
                        rs.getObject("role_id", UUID.class),
                        ctx))
                .findOne());
    }

    public boolean existsAny() {
        return jdbi.withHandle(handle -> handle.createQuery("""
                        select exists(
                            select 1
                            from user_account
                        )
                        """)
                .mapTo(Boolean.class)
                .one());
    }

    public Optional<User> upsert(User user) {
        return jdbi.withHandle(handle -> handle.createQuery("""
                        insert into user_account (id, username, password, display_name, created, role_id)
                        values (:id, :username, :password, :displayName, :created, :roleId)
                        on conflict (id) do update
                        set username = excluded.username,
                            password = excluded.password,
                            display_name = excluded.display_name,
                            role_id = excluded.role_id
                        returning id, username, password, display_name, created, role_id
                        """)
                .bind("id", user.id())
                .bind("username", user.username())
                .bind("password", user.password())
                .bind("displayName", user.displayName())
                .bind("created", OffsetDateTime.ofInstant(user.created(), ZoneOffset.UTC))
                .bind("roleId", user.roleId())
                .map((rs, ctx) -> mapUser(
                        rs.getObject("id", UUID.class),
                        rs.getString("username"),
                        rs.getString("password"),
                        rs.getString("display_name"),
                        rs.getObject("created", OffsetDateTime.class).toInstant(),
                        rs.getObject("role_id", UUID.class),
                        ctx))
                .findOne());
    }

    public boolean deleteById(UUID id) {
        return jdbi.withHandle(handle -> handle.createUpdate("""
                        delete from user_account
                        where id = :id
                        """)
                .bind("id", id)
                .execute()) > 0;
    }

    private User mapUser(
            UUID id,
            String username,
            String password,
            String displayName,
            Instant created,
            UUID roleId,
            StatementContext ctx
    ) {
        return new User(id, username, password, displayName, created, roleId);
    }
}
