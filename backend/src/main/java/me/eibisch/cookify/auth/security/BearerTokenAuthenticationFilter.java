package me.eibisch.cookify.auth.security;

import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;
import java.util.UUID;
import me.eibisch.cookify.api.ApiError;
import me.eibisch.cookify.auth.domain.AuthenticatedSession;
import me.eibisch.cookify.auth.service.SessionAuthenticationService;
import me.eibisch.cookify.role.RoleIds;

@Provider
@ApplicationScoped
@Priority(Priorities.AUTHENTICATION)
public class BearerTokenAuthenticationFilter implements ContainerRequestFilter {

    private final SessionAuthenticationService sessionAuthenticationService;

    @Inject
    public BearerTokenAuthenticationFilter(SessionAuthenticationService sessionAuthenticationService) {
        this.sessionAuthenticationService = sessionAuthenticationService;
    }

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        if (isPublicEndpoint(requestContext)) {
            return;
        }

        String authorization = requestContext.getHeaderString(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            requestContext.abortWith(error(Response.Status.UNAUTHORIZED, "A valid bearer token is required."));
            return;
        }

        String rawToken = authorization.substring("Bearer ".length()).trim();
        UUID sessionId;
        try {
            sessionId = UUID.fromString(rawToken);
        } catch (IllegalArgumentException exception) {
            requestContext.abortWith(error(Response.Status.UNAUTHORIZED, "A valid bearer token is required."));
            return;
        }

        AuthenticatedSession session = sessionAuthenticationService.findBySessionId(sessionId)
                .orElse(null);
        if (session == null) {
            requestContext.abortWith(error(Response.Status.UNAUTHORIZED, "The session is invalid."));
            return;
        }

        UUID requiredRoleId = requiredRoleId(requestContext);
        if (requiredRoleId != null && !hasRequiredRole(session.roleId(), requiredRoleId)) {
            requestContext.abortWith(error(Response.Status.FORBIDDEN, "The current user is not allowed to access this resource."));
            return;
        }

        requestContext.setProperty("authenticatedSessionId", session.sessionId());
        requestContext.setProperty("authenticatedUserId", session.userId());
        requestContext.setProperty("authenticatedRoleId", session.roleId());
    }

    private boolean isPublicEndpoint(ContainerRequestContext requestContext) {
        String path = normalizePath(requestContext);
        String method = requestContext.getMethod();

        if ("POST".equals(method) && "api/auth/login".equals(path)) {
            return true;
        }

        return ("POST".equals(method) || "GET".equals(method)) && path.startsWith("api/invite/");
    }

    private UUID requiredRoleId(ContainerRequestContext requestContext) {
        String path = normalizePath(requestContext);
        String method = requestContext.getMethod();

        if ("POST".equals(method) && "api/invite".equals(path)) {
            return RoleIds.ADMIN;
        }

        return RoleIds.USER;
    }

    private boolean hasRequiredRole(UUID actualRoleId, UUID requiredRoleId) {
        if (RoleIds.ADMIN.equals(actualRoleId)) {
            return true;
        }

        return actualRoleId.equals(requiredRoleId);
    }

    private String normalizePath(ContainerRequestContext requestContext) {
        String path = requestContext.getUriInfo().getPath();
        if (path == null || path.isBlank()) {
            return "";
        }

        String normalizedPath = path.startsWith("/") ? path.substring(1) : path;
        while (normalizedPath.endsWith("/")) {
            normalizedPath = normalizedPath.substring(0, normalizedPath.length() - 1);
        }

        return normalizedPath;
    }

    private Response error(Response.Status status, String message) {
        return Response.status(status)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(new ApiError(message))
                .build();
    }
}
