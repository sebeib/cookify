package me.eibisch.cookify.invite.rest;

import jakarta.validation.constraints.NotBlank;

public record CreateInviteRequest(@NotBlank String roleName) {
}
