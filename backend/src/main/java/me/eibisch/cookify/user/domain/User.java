package me.eibisch.cookify.user.domain;

import java.time.Instant;
import java.util.UUID;

public record User(
        UUID id,
        String username,
        String password,
        String displayName,
        String profileImage,
        Instant created,
        UUID roleId
) {
}
