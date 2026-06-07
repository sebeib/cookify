package me.eibisch.cookify.auth.domain;

import java.time.Instant;
import java.util.UUID;

public record Session(
        UUID id,
        UUID userId,
        Instant created
) {
}
