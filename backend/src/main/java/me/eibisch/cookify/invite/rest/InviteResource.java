package me.eibisch.cookify.invite.rest;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.UUID;
import me.eibisch.cookify.invite.service.InviteRegistrationService;
import me.eibisch.cookify.invite.service.InviteService;
import me.eibisch.cookify.user.rest.RegisterUserRequest;
import me.eibisch.cookify.user.rest.UserResponse;

@Path("/api/invite")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class InviteResource {

    private final InviteService inviteService;
    private final InviteRegistrationService inviteRegistrationService;

    @Inject
    public InviteResource(InviteService inviteService, InviteRegistrationService inviteRegistrationService) {
        this.inviteService = inviteService;
        this.inviteRegistrationService = inviteRegistrationService;
    }

    @POST
    public Response createInvite(@Valid CreateInviteRequest request) {
        InviteResponse invite = inviteService.create(request);
        return Response.status(Response.Status.CREATED)
                .entity(invite)
                .build();
    }

    @POST
    @Path("/{id}")
    public Response registerWithInvite(@PathParam("id") UUID inviteId, @Valid RegisterUserRequest request) {
        UserResponse createdUser = inviteRegistrationService.register(inviteId, request);
        return Response.status(Response.Status.CREATED)
                .entity(createdUser)
                .build();
    }

    @GET
    @Path("/{id}")
    public Response checkInvite(@PathParam("id") UUID inviteId) {
        inviteRegistrationService.assertInviteExists(inviteId);
        return Response.noContent().build();
    }
}
