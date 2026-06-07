package me.eibisch.cookify.user.rest;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;
import me.eibisch.cookify.user.service.UserService;

@Path("/api/user")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class UserResource {

    private final UserService userService;

    @Inject
    public UserResource(UserService userService) {
        this.userService = userService;
    }

    @GET
    public List<UserResponse> getUsers() {
        return userService.findAll();
    }

    @GET
    @Path("/{id}")
    public UserResponse getUser(@PathParam("id") UUID id) {
        return userService.findById(id);
    }

    @PUT
    @Path("/{id}")
    public UserResponse updateUser(@PathParam("id") UUID id, @Valid UpdateUserRequest request) {
        return userService.update(id, request);
    }

    @DELETE
    @Path("/{id}")
    public Response deleteUser(@PathParam("id") UUID id) {
        userService.delete(id);
        return Response.noContent().build();
    }
}
