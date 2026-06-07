package me.eibisch.cookify.auth.service;

import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;
import java.time.Instant;
import java.util.UUID;
import me.eibisch.cookify.api.ApiException;
import me.eibisch.cookify.auth.domain.Session;
import me.eibisch.cookify.auth.repository.SessionRepository;
import me.eibisch.cookify.auth.rest.LoginRequest;
import me.eibisch.cookify.auth.rest.LoginResponse;
import me.eibisch.cookify.user.domain.User;
import me.eibisch.cookify.user.repository.UserRepository;
import me.eibisch.cookify.user.rest.UserResponse;

@ApplicationScoped
public class AuthService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;

    @Inject
    public AuthService(UserRepository userRepository, SessionRepository sessionRepository) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
    }

    public LoginResponse login(LoginRequest request) {
        String normalizedUsername = request.username().trim();

        User user = userRepository.findByUsername(normalizedUsername)
                .orElseThrow(() -> new ApiException(Response.Status.UNAUTHORIZED, "Invalid username or password."));

        if (!BcryptUtil.matches(request.password(), user.password())) {
            throw new ApiException(Response.Status.UNAUTHORIZED, "Invalid username or password.");
        }

        Session session = new Session(UUID.randomUUID(), user.id(), Instant.now());
        Session createdSession = sessionRepository.create(session)
                .orElseThrow(() -> new ApiException(Response.Status.INTERNAL_SERVER_ERROR, "The session could not be created."));

        return new LoginResponse(createdSession.id(), UserResponse.from(user));
    }
}
