package me.eibisch.cookify.invite.domain;

import java.util.UUID;

public record Invite(
        UUID id,
        UUID roleId
) {
}
