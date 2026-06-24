package me.eibisch.cookify.recipe.domain;

import java.util.Arrays;

public enum RecipeUnit {
    G("g"),
    KG("kg"),
    ML("ml"),
    L("l"),
    TL("TL"),
    EL("EL"),
    PCS("pcs"),
    PINCH("pinch");

    private final String label;

    RecipeUnit(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    public static RecipeUnit from(String value) {
        return Arrays.stream(values())
                .filter(unit -> unit.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown recipe unit: " + value));
    }
}
