package uk.jimsimrodev.arcanemporiumapi.domain.favorites.mapper;

import uk.jimsimrodev.arcanemporiumapi.domain.favorites.dto.FavoriteResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.favorites.model.Favorite;

import java.time.LocalDateTime;

public final class FavoriteMapper {

    private FavoriteMapper() {
    }

    //Entity -> DTO
    public static FavoriteResponse toResponse(Favorite favorite) {

        return new FavoriteResponse(
                favorite.getId(),
                favorite.getArtifactId(),
                favorite.getCreatedAt());
    }

    //DTO -> Entity
    public static Favorite toEntity(Long userId, Long artifactId) {
        Favorite favorite = new Favorite();
        favorite.setUserId(userId);
        favorite.setArtifactId(artifactId);
        favorite.setCreatedAt(LocalDateTime.now());
        return favorite;
    }
}
