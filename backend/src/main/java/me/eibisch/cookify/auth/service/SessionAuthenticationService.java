package me.eibisch.cookify.auth.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;
import java.util.Optional;
import java.util.UUID;
import me.eibisch.cookify.api.ApiException;
import me.eibisch.cookify.auth.domain.AuthenticatedSession;
import me.eibisch.cookify.auth.repository.SessionRepository;

@ApplicationScoped
public class SessionAuthenticationService {

    private final SessionRepository sessionRepository;

    @Inject
    public SessionAuthenticationService(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public Optional<AuthenticatedSession> findBySessionId(UUID sessionId) {
        return sessionRepository.findAuthenticatedById(sessionId);
    }

    public void logout(UUID sessionId) {
        if (!sessionRepository.deleteById(sessionId)) {
            throw new ApiException(Response.Status.UNAUTHORIZED, "The session is invalid.");
        }
    }
}
