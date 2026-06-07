package me.eibisch.cookify.user.rest;

import jakarta.validation.constraints.NotBlank;

public record RegisterUserRequest(
        @NotBlank String username,
        @NotBlank String password,
        @NotBlank String displayName
) {
}
