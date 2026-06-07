package me.eibisch.cookify.invite.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;
import java.util.UUID;
import me.eibisch.cookify.api.ApiException;
import me.eibisch.cookify.invite.domain.Invite;
import me.eibisch.cookify.invite.repository.InviteRepository;
import me.eibisch.cookify.invite.rest.CreateInviteRequest;
import me.eibisch.cookify.invite.rest.InviteResponse;
import me.eibisch.cookify.role.RoleRepository;

@ApplicationScoped
public class InviteService {

    private final InviteRepository inviteRepository;
    private final RoleRepository roleRepository;

    @Inject
    public InviteService(InviteRepository inviteRepository, RoleRepository roleRepository) {
        this.inviteRepository = inviteRepository;
        this.roleRepository = roleRepository;
    }

    public InviteResponse create(CreateInviteRequest request) {
        String normalizedRoleName = request.roleName().trim().toUpperCase();
        UUID roleId = roleRepository.findIdByName(normalizedRoleName)
                .orElseThrow(() -> new ApiException(
                        Response.Status.BAD_REQUEST,
                        "Role '%s' does not exist.".formatted(normalizedRoleName)));

        Invite invite = new Invite(UUID.randomUUID(), roleId);
        return inviteRepository.create(invite)
                .map(InviteResponse::from)
                .orElseThrow(() -> new ApiException(Response.Status.INTERNAL_SERVER_ERROR, "The invite could not be created."));
    }
}
