package me.eibisch.cookify.tag.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import me.eibisch.cookify.tag.domain.Tag;
import me.eibisch.cookify.tag.repository.TagRepository;

@ApplicationScoped
public class TagService {

    private final TagRepository tagRepository;

    @Inject
    public TagService(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    public List<Tag> findSuggestions(String query) {
        return tagRepository.findSuggestions(query);
    }

    public List<Tag> resolveTags(List<String> rawTags) {
        if (rawTags == null || rawTags.isEmpty()) {
            return List.of();
        }

        LinkedHashMap<String, String> normalizedToDisplayName = new LinkedHashMap<>();
        for (String rawTag : rawTags) {
            String normalizedDisplayName = normalizeDisplayName(rawTag);
            if (normalizedDisplayName == null) {
                continue;
            }

            normalizedToDisplayName.putIfAbsent(
                    normalizedDisplayName.toLowerCase(Locale.ROOT),
                    normalizedDisplayName
            );
        }

        if (normalizedToDisplayName.isEmpty()) {
            return List.of();
        }

        List<Tag> resolvedTags = new ArrayList<>();
        for (String normalizedName : normalizedToDisplayName.keySet()) {
            Tag resolvedTag = tagRepository.findByName(normalizedName)
                    .orElseGet(() -> tagRepository.create(new Tag(
                            UUID.randomUUID(),
                            normalizedToDisplayName.get(normalizedName),
                            createPastelColor(normalizedToDisplayName.get(normalizedName))
                    )));
            resolvedTags.add(resolvedTag);
        }

        return resolvedTags;
    }

    private String normalizeDisplayName(String rawTag) {
        if (rawTag == null) {
            return null;
        }

        String normalizedTag = rawTag.trim().replaceAll("\\s+", " ");
        return normalizedTag.isBlank() ? null : normalizedTag;
    }

    private String createPastelColor(String tagName) {
        String normalizedTagName = tagName == null ? "" : tagName.trim().toLowerCase(Locale.ROOT);

        int hue = 0;
        int saturationOffset = 0;
        int lightnessOffset = 0;

        for (int index = 0; index < normalizedTagName.length(); index++) {
            int characterCode = normalizedTagName.charAt(index);
            hue = (hue * 31 + characterCode) % 360;
            saturationOffset = (saturationOffset * 17 + characterCode) % 15;
            lightnessOffset = (lightnessOffset * 13 + characterCode) % 7;
        }

        int saturation = 58 + saturationOffset;
        int lightness = 82 + lightnessOffset;
        return "hsl(%d 70%% %d%%)".formatted(hue, lightness).replace("70%", saturation + "%");
    }
}
