package me.eibisch.cookify.recipe.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import me.eibisch.cookify.api.ApiException;
import me.eibisch.cookify.recipe.domain.RecipeIngredient;
import me.eibisch.cookify.recipe.domain.RecipeUnit;
import me.eibisch.cookify.recipe.rest.ImportedRecipeResponse;
import me.eibisch.cookify.recipe.rest.RecipeIngredientResponse;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

@ApplicationScoped
public class RecipeImportService {

    private static final Pattern AMOUNT_AND_UNIT_PATTERN = Pattern.compile(
            "^\\s*(?<amount>\\d+(?:[.,]\\d+)?|\\d+\\/\\d+|\\d+\\s+\\d+\\/\\d+)\\s*(?<unit>[\\p{L}.]+)?\\s+(?<name>.+)$"
    );

    private static final Map<String, RecipeUnit> UNIT_ALIASES = Map.ofEntries(
            Map.entry("g", RecipeUnit.G),
            Map.entry("gram", RecipeUnit.G),
            Map.entry("grams", RecipeUnit.G),
            Map.entry("gr", RecipeUnit.G),
            Map.entry("kg", RecipeUnit.KG),
            Map.entry("kilogram", RecipeUnit.KG),
            Map.entry("kilograms", RecipeUnit.KG),
            Map.entry("ml", RecipeUnit.ML),
            Map.entry("milliliter", RecipeUnit.ML),
            Map.entry("milliliters", RecipeUnit.ML),
            Map.entry("l", RecipeUnit.L),
            Map.entry("liter", RecipeUnit.L),
            Map.entry("liters", RecipeUnit.L),
            Map.entry("litre", RecipeUnit.L),
            Map.entry("litres", RecipeUnit.L),
            Map.entry("tl", RecipeUnit.TL),
            Map.entry("tsp", RecipeUnit.TL),
            Map.entry("teaspoon", RecipeUnit.TL),
            Map.entry("teaspoons", RecipeUnit.TL),
            Map.entry("el", RecipeUnit.EL),
            Map.entry("tbsp", RecipeUnit.EL),
            Map.entry("tablespoon", RecipeUnit.EL),
            Map.entry("tablespoons", RecipeUnit.EL),
            Map.entry("pcs", RecipeUnit.PCS),
            Map.entry("pc", RecipeUnit.PCS),
            Map.entry("piece", RecipeUnit.PCS),
            Map.entry("pieces", RecipeUnit.PCS),
            Map.entry("pinch", RecipeUnit.PINCH),
            Map.entry("pinches", RecipeUnit.PINCH),
            Map.entry("prise", RecipeUnit.PINCH)
    );

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Inject
    public RecipeImportService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    public ImportedRecipeResponse importFromUrl(String rawUrl) {
        URI uri = validateUrl(rawUrl);
        String html = fetchHtml(uri);
        Document document = Jsoup.parse(html, uri.toString());
        JsonNode recipeNode = findRecipeNode(document)
                .orElseThrow(() -> new ApiException(
                        Response.Status.BAD_REQUEST,
                        "The provided website does not expose a schema.org Recipe."
                ));

        String title = readText(recipeNode.get("name"));
        List<RecipeIngredient> ingredients = extractIngredients(recipeNode.get("recipeIngredient"));
        String instructions = extractInstructions(recipeNode.get("recipeInstructions"));
        String description = buildDescription(recipeNode, instructions);
        String image = extractImage(recipeNode.get("image"), uri);

        if (title == null
                || title.isBlank()
                || ingredients.isEmpty()
                || description == null
                || description.isBlank()
                || instructions == null
                || instructions.isBlank()) {
            throw new ApiException(
                    Response.Status.BAD_REQUEST,
                    "The imported recipe is incomplete and cannot be used."
            );
        }

        JsonNode nutrition = recipeNode.get("nutrition");

        return new ImportedRecipeResponse(
                title.trim(),
                image,
                ingredients.stream()
                        .map(RecipeIngredientResponse::from)
                        .toList(),
                description.trim(),
                instructions.trim(),
                parseDecimal(readText(nutrition == null ? null : nutrition.get("carbohydrateContent"))),
                parseDecimal(readText(nutrition == null ? null : nutrition.get("proteinContent"))),
                parseDecimal(readText(nutrition == null ? null : nutrition.get("fatContent"))),
                parseInteger(readText(nutrition == null ? null : nutrition.get("calories")))
        );
    }

    private URI validateUrl(String rawUrl) {
        URI uri;
        try {
            uri = new URI(rawUrl.trim());
        } catch (URISyntaxException exception) {
            throw new ApiException(Response.Status.BAD_REQUEST, "The provided URL is invalid.");
        }

        if (!"http".equalsIgnoreCase(uri.getScheme()) && !"https".equalsIgnoreCase(uri.getScheme())) {
            throw new ApiException(Response.Status.BAD_REQUEST, "Only http and https URLs are supported.");
        }

        if (uri.getHost() == null || uri.getHost().isBlank()) {
            throw new ApiException(Response.Status.BAD_REQUEST, "The provided URL is invalid.");
        }

        if (isPrivateHost(uri.getHost())) {
            throw new ApiException(Response.Status.BAD_REQUEST, "Private or local hosts are not allowed.");
        }

        return uri;
    }

    private boolean isPrivateHost(String host) {
        String normalizedHost = host.toLowerCase(Locale.ROOT);
        if ("localhost".equals(normalizedHost)) {
            return true;
        }

        try {
            InetAddress[] addresses = InetAddress.getAllByName(host);
            for (InetAddress address : addresses) {
                if (address.isAnyLocalAddress()
                        || address.isLoopbackAddress()
                        || address.isLinkLocalAddress()
                        || address.isSiteLocalAddress()
                        || address.isMulticastAddress()
                        || isUniqueLocalIpv6(address)) {
                    return true;
                }
            }
        } catch (IOException exception) {
            throw new ApiException(Response.Status.BAD_REQUEST, "The provided host could not be resolved.");
        }

        return false;
    }

    private boolean isUniqueLocalIpv6(InetAddress address) {
        if (!(address instanceof Inet6Address inet6Address)) {
            return false;
        }

        byte[] bytes = inet6Address.getAddress();
        return bytes.length > 0 && (bytes[0] & (byte) 0xfe) == (byte) 0xfc;
    }

    private String fetchHtml(URI uri) {
        HttpRequest request = HttpRequest.newBuilder(uri)
                .GET()
                .timeout(Duration.ofSeconds(15))
                .header("User-Agent", "Cookify/1.0 (+https://cookify.eibisch.me)")
                .header("Accept", "text/html,application/xhtml+xml")
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException | InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ApiException(Response.Status.BAD_GATEWAY, "The recipe website could not be loaded.");
        }

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new ApiException(Response.Status.BAD_GATEWAY, "The recipe website returned an unexpected response.");
        }

        return response.body();
    }

    private Optional<JsonNode> findRecipeNode(Document document) {
        for (Element script : document.select("script[type=application/ld+json]")) {
            String jsonLd = script.data();
            if (jsonLd == null || jsonLd.isBlank()) {
                continue;
            }

            try {
                JsonNode root = objectMapper.readTree(jsonLd);
                List<JsonNode> candidates = new ArrayList<>();
                collectRecipeNodes(root, candidates);

                if (!candidates.isEmpty()) {
                    return candidates.stream()
                            .filter(candidate -> readText(candidate.get("name")) != null)
                            .findFirst()
                            .or(() -> Optional.of(candidates.getFirst()));
                }
            } catch (Exception ignored) {
                // Ignore malformed or unrelated JSON-LD blocks.
            }
        }

        return Optional.empty();
    }

    private void collectRecipeNodes(JsonNode node, List<JsonNode> candidates) {
        if (node == null || node.isNull()) {
            return;
        }

        if (node.isArray()) {
            node.forEach(item -> collectRecipeNodes(item, candidates));
            return;
        }

        if (!node.isObject()) {
            return;
        }

        if (isRecipeNode(node)) {
            candidates.add(node);
        }

        Iterator<JsonNode> fields = node.elements();
        while (fields.hasNext()) {
            collectRecipeNodes(fields.next(), candidates);
        }
    }

    private boolean isRecipeNode(JsonNode node) {
        JsonNode typeNode = node.get("@type");
        if (typeNode == null) {
            return false;
        }

        if (typeNode.isTextual()) {
            return "Recipe".equalsIgnoreCase(typeNode.asText());
        }

        if (typeNode.isArray()) {
            for (JsonNode type : typeNode) {
                if (type.isTextual() && "Recipe".equalsIgnoreCase(type.asText())) {
                    return true;
                }
            }
        }

        return false;
    }

    private String buildDescription(JsonNode recipeNode, String instructions) {
        String description = readText(recipeNode.get("description"));
        if (description != null && !description.isBlank()) {
            return description;
        }

        if (instructions == null || instructions.isBlank()) {
            return null;
        }

        String normalizedInstructions = instructions.trim();
        int splitIndex = normalizedInstructions.indexOf('\n');
        String firstParagraph = splitIndex >= 0
                ? normalizedInstructions.substring(0, splitIndex).trim()
                : normalizedInstructions;

        if (firstParagraph.length() > 280) {
            return firstParagraph.substring(0, 277).trim() + "...";
        }

        return firstParagraph;
    }

    private String extractInstructions(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }

        if (node.isTextual()) {
            return node.asText();
        }

        if (node.isArray()) {
            List<String> parts = new ArrayList<>();
            for (JsonNode child : node) {
                String value = extractInstructions(child);
                if (value != null && !value.isBlank()) {
                    parts.add(value.trim());
                }
            }
            return parts.isEmpty() ? null : String.join("\n\n", parts);
        }

        if (node.isObject()) {
            String text = readText(node.get("text"));
            if (text != null && !text.isBlank()) {
                return text;
            }

            String nestedInstructions = extractInstructions(node.get("itemListElement"));
            if (nestedInstructions != null && !nestedInstructions.isBlank()) {
                return nestedInstructions;
            }

            String name = readText(node.get("name"));
            if (name != null && !name.isBlank()) {
                return name;
            }
        }

        return null;
    }

    private List<RecipeIngredient> extractIngredients(JsonNode node) {
        List<RecipeIngredient> ingredients = new ArrayList<>();

        if (node == null || node.isNull()) {
            return ingredients;
        }

        if (node.isArray()) {
            int index = 0;
            for (JsonNode child : node) {
                String ingredientText = readText(child);
                if (ingredientText != null && !ingredientText.isBlank()) {
                    ingredients.add(parseIngredient(index++, ingredientText.trim()));
                }
            }
        } else {
            String ingredientText = readText(node);
            if (ingredientText != null && !ingredientText.isBlank()) {
                ingredients.add(parseIngredient(0, ingredientText.trim()));
            }
        }

        return ingredients;
    }

    private RecipeIngredient parseIngredient(int position, String ingredientText) {
        Matcher matcher = AMOUNT_AND_UNIT_PATTERN.matcher(ingredientText);
        if (!matcher.matches()) {
            return new RecipeIngredient(null, position, ingredientText, null, null);
        }

        BigDecimal amount = parseAmount(matcher.group("amount"));
        String rawUnit = matcher.group("unit");
        String name = matcher.group("name").trim();

        RecipeUnit unit = rawUnit == null ? null : UNIT_ALIASES.get(rawUnit.toLowerCase(Locale.ROOT).replace(".", ""));
        if (amount == null || unit == null) {
            return new RecipeIngredient(null, position, ingredientText, null, null);
        }

        return new RecipeIngredient(null, position, name, amount, unit);
    }

    private BigDecimal parseAmount(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalizedValue = value.trim().replace(',', '.');
        try {
            if (normalizedValue.contains(" ")) {
                String[] parts = normalizedValue.split("\\s+");
                if (parts.length == 2) {
                    return parseAmount(parts[0]).add(parseAmount(parts[1]));
                }
            }

            if (normalizedValue.contains("/")) {
                String[] parts = normalizedValue.split("/");
                if (parts.length == 2) {
                    BigDecimal numerator = new BigDecimal(parts[0]);
                    BigDecimal denominator = new BigDecimal(parts[1]);
                    return numerator.divide(denominator, 2, RoundingMode.HALF_UP);
                }
            }

            return new BigDecimal(normalizedValue);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String extractImage(JsonNode node, URI baseUri) {
        if (node == null || node.isNull()) {
            return null;
        }

        if (node.isTextual()) {
            return resolveUrl(baseUri, node.asText());
        }

        if (node.isArray()) {
            for (JsonNode child : node) {
                String image = extractImage(child, baseUri);
                if (image != null && !image.isBlank()) {
                    return image;
                }
            }
        }

        if (node.isObject()) {
            String url = readText(node.get("url"));
            if (url != null && !url.isBlank()) {
                return resolveUrl(baseUri, url);
            }

            String contentUrl = readText(node.get("contentUrl"));
            if (contentUrl != null && !contentUrl.isBlank()) {
                return resolveUrl(baseUri, contentUrl);
            }
        }

        return null;
    }

    private String resolveUrl(URI baseUri, String rawUrl) {
        try {
            return baseUri.resolve(rawUrl.trim()).toString();
        } catch (Exception exception) {
            return rawUrl;
        }
    }

    private BigDecimal parseDecimal(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        Matcher matcher = Pattern.compile("(\\d+(?:[.,]\\d+)?)").matcher(value);
        if (!matcher.find()) {
            return null;
        }

        return new BigDecimal(matcher.group(1).replace(',', '.'));
    }

    private Integer parseInteger(String value) {
        BigDecimal decimal = parseDecimal(value);
        return decimal == null ? null : decimal.intValue();
    }

    private String readText(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }

        if (node.isTextual()) {
            return node.asText();
        }

        if (node.isObject()) {
            String text = readText(node.get("text"));
            if (text != null && !text.isBlank()) {
                return text;
            }

            String name = readText(node.get("name"));
            if (name != null && !name.isBlank()) {
                return name;
            }

            return readText(node.get("value"));
        }

        return node.isValueNode() ? node.asText() : null;
    }
}
