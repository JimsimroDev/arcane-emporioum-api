package uk.jimsimrodev.arcanemporiumapi.domain.auth.model;

public enum Erole {
    ADMIN("admin"),
    USER("user");

    private String role;

    Erole(String role) {
        this.role = role;
    }

    public String getRole() {
        return role;
    }

    public static Erole fromRole(String role) {
        for (Erole e : Erole.values()) {
            if (e.getRole().equalsIgnoreCase(role)) return e;
        }
        throw new IllegalArgumentException("Role not found");
    }
}
