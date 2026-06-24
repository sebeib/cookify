package me.eibisch.cookify.user.rest;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
        @NotBlank String displayName,
        String profileImage
) {
}
