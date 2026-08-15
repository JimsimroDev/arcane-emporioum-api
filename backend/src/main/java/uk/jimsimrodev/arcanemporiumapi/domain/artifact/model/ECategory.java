package uk.jimsimrodev.arcanemporiumapi.domain.artifact.model;

public enum ECategory {
    WEAPON("weapon"),
    SCROLL("scroll"),
    RELIC("relic"),
    ARMOR("armor"),
    POTION("potion");

    private String category;

    ECategory(String category) {
        this.category = category;
    }

    public String getCategory() {
        return category;
    }

    public static ECategory fromRole(String category) {
        for (ECategory e : ECategory.values()) {
            if (e.getCategory().equalsIgnoreCase(category))
                return e;
        }
        throw new IllegalArgumentException("Category not found");
    }
}
