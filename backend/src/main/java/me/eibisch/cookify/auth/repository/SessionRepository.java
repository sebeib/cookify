package me.eibisch.cookify.auth.repository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import me.eibisch.cookify.auth.domain.AuthenticatedSession;
import me.eibisch.cookify.auth.domain.Session;
import org.jdbi.v3.core.Jdbi;

@ApplicationScoped
public class SessionRepository {

    private final Jdbi jdbi;

    @Inject
    public SessionRepository(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    public Optional<Session> create(Session session) {
        return jdbi.withHandle(handle -> handle.createQuery("""
                        insert into session (id, user_id, created)
                        values (:id, :userId, :created)
                        returning id, user_id, created
                        """)
                .bind("id", session.id())
                .bind("userId", session.userId())
                .bind("created", OffsetDateTime.ofInstant(session.created(), ZoneOffset.UTC))
                .map((rs, ctx) -> new Session(
                        rs.getObject("id", UUID.class),
                        rs.getObject("user_id", UUID.class),
                        rs.getObject("created", OffsetDateTime.class).toInstant()))
                .findOne());
    }

    public Optional<AuthenticatedSession> findAuthenticatedById(UUID sessionId) {
        return jdbi.withHandle(handle -> handle.createQuery("""
                        select s.id, s.user_id, u.role_id
                        from session s
                        join user_account u on u.id = s.user_id
                        where s.id = :sessionId
                        """)
                .bind("sessionId", sessionId)
                .map((rs, ctx) -> new AuthenticatedSession(
                        rs.getObject("id", UUID.class),
                        rs.getObject("user_id", UUID.class),
                        rs.getObject("role_id", UUID.class)))
                .findOne());
    }

    public boolean deleteById(UUID sessionId) {
        return jdbi.withHandle(handle -> handle.createUpdate("""
                        delete from session
                        where id = :sessionId
                        """)
                .bind("sessionId", sessionId)
                .execute()) > 0;
    }
}
