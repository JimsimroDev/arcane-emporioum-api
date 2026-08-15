package uk.jimsimrodev.arcanemporiumapi.domain.favorites.dto;

import java.time.LocalDateTime;

public record FavoriteResponse(
        Long userId,
        Long artifactId,
        LocalDateTime createdAt) {
}
