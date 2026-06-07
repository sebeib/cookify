package me.eibisch.cookify.user.service;

import me.eibisch.cookify.role.RoleRepository;
import me.eibisch.cookify.api.ApiException;
import me.eibisch.cookify.user.domain.User;
import me.eibisch.cookify.user.repository.UserRepository;
import me.eibisch.cookify.user.rest.UpdateUserRequest;
import me.eibisch.cookify.user.rest.UserResponse;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Inject
    public UserService(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    public List<UserResponse> findAll() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::from)
                .toList();
    }

    public UserResponse findById(UUID id) {
        return userRepository.findById(id)
                .map(UserResponse::from)
                .orElseThrow(() -> new ApiException(Response.Status.NOT_FOUND, "User %s was not found.".formatted(id)));
    }

    public UserResponse update(UUID id, UpdateUserRequest request) {
        validatePassword(request.password());
        String normalizedUsername = request.username().trim();
        String normalizedDisplayName = request.displayName().trim();

        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(Response.Status.NOT_FOUND, "User %s was not found.".formatted(id)));

        if (!roleRepository.existsById(request.roleId())) {
            throw new ApiException(Response.Status.BAD_REQUEST, "roleId %s does not exist.".formatted(request.roleId()));
        }

        userRepository.findByUsername(normalizedUsername)
                .filter(user -> !user.id().equals(id))
                .ifPresent(user -> {
                    throw new ApiException(Response.Status.CONFLICT, "Username '%s' is already taken.".formatted(normalizedUsername));
                });

        String passwordHash = request.password() == null || request.password().isBlank()
                ? existingUser.password()
                : BcryptUtil.bcryptHash(request.password());

        User updatedUser = new User(
                id,
                normalizedUsername,
                passwordHash,
                normalizedDisplayName,
                existingUser.created(),
                request.roleId()
        );

        return userRepository.upsert(updatedUser)
                .map(UserResponse::from)
                .orElseThrow(() -> new ApiException(Response.Status.NOT_FOUND, "User %s was not found.".formatted(id)));
    }

    public void delete(UUID id) {
        if (!userRepository.deleteById(id)) {
            throw new ApiException(Response.Status.NOT_FOUND, "User %s was not found.".formatted(id));
        }
    }

    private void validatePassword(String password) {
        if (password != null && password.isBlank()) {
            throw new ApiException(Response.Status.BAD_REQUEST, "If a password is provided, it must not be blank.");
        }
    }
}
