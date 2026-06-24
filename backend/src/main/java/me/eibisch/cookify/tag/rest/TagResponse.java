package me.eibisch.cookify.tag.rest;

import java.util.UUID;
import me.eibisch.cookify.tag.domain.Tag;

public record TagResponse(
        UUID id,
        String name,
        String color
) {
    public static TagResponse from(Tag tag) {
        return new TagResponse(tag.id(), tag.name(), tag.color());
    }
}
