package me.eibisch.cookify.tag.domain;

import java.util.UUID;

public record Tag(
        UUID id,
        String name,
        String color
) {
}
