package uk.jimsimrodev.arcanemporiumapi.domain.auth.dto;

public record ChangePassword(String currentPassword, String newPassword) {
}
