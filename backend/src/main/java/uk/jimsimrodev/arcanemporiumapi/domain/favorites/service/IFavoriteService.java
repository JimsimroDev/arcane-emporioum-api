package uk.jimsimrodev.arcanemporiumapi.domain.favorites.service;

import java.util.Locale;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import uk.jimsimrodev.arcanemporiumapi.domain.artifact.dto.ArtifactResponse;

public interface IFavoriteService {

    ArtifactResponse addFavorite(String userEmail, Long artifactId, Locale locale, String currency);

    public Page<ArtifactResponse> getFavorites(Pageable pagination,String userEmail, Locale locale, String currency);

    public void removeFavorite(String userEmail, Long artifactId);

}
