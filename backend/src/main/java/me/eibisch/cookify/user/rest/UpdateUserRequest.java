package me.eibisch.cookify.user.rest;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record UpdateUserRequest(
        @NotBlank String username,
        String password,
        @NotBlank String displayName,
        @NotNull UUID roleId
) {
}
