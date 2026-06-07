package me.eibisch.cookify.auth.rest;

import java.util.UUID;
import me.eibisch.cookify.user.rest.UserResponse;

public record LoginResponse(
        UUID sessionId,
        UserResponse user
) {
}
