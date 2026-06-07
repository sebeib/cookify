package me.eibisch.cookify.invite.rest;

import java.util.UUID;
import me.eibisch.cookify.invite.domain.Invite;

public record InviteResponse(
        UUID id,
        UUID roleId
) {
    public static InviteResponse from(Invite invite) {
        return new InviteResponse(invite.id(), invite.roleId());
    }
}
