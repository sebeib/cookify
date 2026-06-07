package me.eibisch.cookify.auth.rest;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.UUID;
import me.eibisch.cookify.auth.service.AuthService;
import me.eibisch.cookify.auth.service.SessionAuthenticationService;

@Path("/api/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {

    private final AuthService authService;
    private final SessionAuthenticationService sessionAuthenticationService;

    @Inject
    public AuthResource(AuthService authService, SessionAuthenticationService sessionAuthenticationService) {
        this.authService = authService;
        this.sessionAuthenticationService = sessionAuthenticationService;
    }

    @POST
    @Path("/login")
    public LoginResponse login(@Valid LoginRequest request) {
        return authService.login(request);
    }

    @POST
    @Path("/logout")
    public Response logout(@Context ContainerRequestContext requestContext) {
        UUID sessionId = (UUID) requestContext.getProperty("authenticatedSessionId");
        sessionAuthenticationService.logout(sessionId);
        return Response.noContent().build();
    }
}
