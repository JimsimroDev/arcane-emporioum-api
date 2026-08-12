package uk.jimsimrodev.arcanemporiumapi.domain.auth.dto;

public record UserRequest(
        String email,
        String password) {
}
