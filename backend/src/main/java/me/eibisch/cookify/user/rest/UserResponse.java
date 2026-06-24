package me.eibisch.cookify.user.rest;

import java.time.Instant;
import java.util.UUID;
import me.eibisch.cookify.user.domain.User;

public record UserResponse(
        UUID id,
        String username,
        String displayName,
        String profileImage,
        Instant created,
        UUID roleId
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.id(),
                user.username(),
                user.displayName(),
                user.profileImage(),
                user.created(),
                user.roleId()
        );
    }
}
