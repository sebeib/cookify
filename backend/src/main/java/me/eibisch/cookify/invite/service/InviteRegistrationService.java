package me.eibisch.cookify.invite.service;

import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;
import java.time.Instant;
import java.util.UUID;
import me.eibisch.cookify.api.ApiException;
import me.eibisch.cookify.invite.domain.Invite;
import me.eibisch.cookify.invite.repository.InviteRepository;
import me.eibisch.cookify.role.RoleRepository;
import me.eibisch.cookify.user.domain.User;
import me.eibisch.cookify.user.repository.UserRepository;
import me.eibisch.cookify.user.rest.RegisterUserRequest;
import me.eibisch.cookify.user.rest.UserResponse;

@ApplicationScoped
public class InviteRegistrationService {

    private final InviteRepository inviteRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    @Inject
    public InviteRegistrationService(
            InviteRepository inviteRepository,
            RoleRepository roleRepository,
            UserRepository userRepository
    ) {
        this.inviteRepository = inviteRepository;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
    }

    public UserResponse register(UUID inviteId, RegisterUserRequest request) {
        Invite existingInvite = inviteRepository.findById(inviteId)
                .orElseThrow(() -> new ApiException(Response.Status.NOT_FOUND, "Invite %s was not found.".formatted(inviteId)));

        String normalizedUsername = request.username().trim();
        String normalizedDisplayName = request.displayName().trim();

        if (request.password().isBlank()) {
            throw new ApiException(Response.Status.BAD_REQUEST, "Password must not be blank.");
        }

        userRepository.findByUsername(normalizedUsername)
                .ifPresent(user -> {
                    throw new ApiException(Response.Status.CONFLICT, "Username '%s' is already taken.".formatted(normalizedUsername));
                });

        Invite invite = inviteRepository.consumeById(inviteId)
                .orElseThrow(() -> new ApiException(Response.Status.NOT_FOUND, "Invite %s was not found.".formatted(inviteId)));

        if (!roleRepository.existsById(existingInvite.roleId())) {
            throw new ApiException(Response.Status.BAD_REQUEST, "The invite role %s does not exist.".formatted(existingInvite.roleId()));
        }

        User user = new User(
                UUID.randomUUID(),
                normalizedUsername,
                BcryptUtil.bcryptHash(request.password()),
                normalizedDisplayName,
                Instant.now(),
                invite.roleId()
        );

        UserResponse createdUser = userRepository.upsert(user)
                .map(UserResponse::from)
                .orElseThrow(() -> new ApiException(Response.Status.INTERNAL_SERVER_ERROR, "User could not be created."));

        return createdUser;
    }

    public void assertInviteExists(UUID inviteId) {
        inviteRepository.findById(inviteId)
                .orElseThrow(() -> new ApiException(Response.Status.NOT_FOUND, "Invite %s was not found.".formatted(inviteId)));
    }
}
