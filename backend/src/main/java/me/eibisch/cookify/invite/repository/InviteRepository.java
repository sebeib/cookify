package me.eibisch.cookify.invite.repository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Optional;
import java.util.UUID;
import me.eibisch.cookify.invite.domain.Invite;
import org.jdbi.v3.core.Jdbi;

@ApplicationScoped
public class InviteRepository {

    private final Jdbi jdbi;

    @Inject
    public InviteRepository(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    public Optional<Invite> create(Invite invite) {
        return jdbi.withHandle(handle -> handle.createQuery("""
                        insert into invite (id, role_id)
                        values (:id, :roleId)
                        returning id, role_id
                        """)
                .bind("id", invite.id())
                .bind("roleId", invite.roleId())
                .map((rs, ctx) -> new Invite(
                        rs.getObject("id", UUID.class),
                        rs.getObject("role_id", UUID.class)))
                .findOne());
    }

    public boolean existsAny() {
        return jdbi.withHandle(handle -> handle.createQuery("""
                        select exists(
                            select 1
                            from invite
                        )
                        """)
                .mapTo(Boolean.class)
                .one());
    }

    public Optional<Invite> consumeById(UUID id) {
        return jdbi.withHandle(handle -> handle.createQuery("""
                        delete from invite
                        where id = :id
                        returning id, role_id
                        """)
                .bind("id", id)
                .map((rs, ctx) -> new Invite(
                        rs.getObject("id", UUID.class),
                        rs.getObject("role_id", UUID.class)))
                .findOne());
    }

    public Optional<Invite> findById(UUID id) {
        return jdbi.withHandle(handle -> handle.createQuery("""
                        select id, role_id
                        from invite
                        where id = :id
                        """)
                .bind("id", id)
                .map((rs, ctx) -> new Invite(
                        rs.getObject("id", UUID.class),
                        rs.getObject("role_id", UUID.class)))
                .findOne());
    }
}
