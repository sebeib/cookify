package me.eibisch.cookify.auth.domain;

import java.util.UUID;

public record AuthenticatedSession(
        UUID sessionId,
        UUID userId,
        UUID roleId
) {
}
