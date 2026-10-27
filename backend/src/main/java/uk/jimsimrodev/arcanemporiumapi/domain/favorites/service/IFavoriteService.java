package uk.jimsimrodev.arcanemporiumapi.domain.favorites.service;

import org.springframework.data.domain.Pageable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.dto.ArtifactResponse;

import java.util.Locale;

public interface IFavoriteService {

    Mono<ArtifactResponse> addFavorite(String userEmail, Long artifactId, Locale locale, String currency);

    Flux<ArtifactResponse> getFavorites(Pageable pagination, String userEmail, Locale locale, String currency);

    Mono<Void> removeFavorite(String userEmail, Long artifactId);

}
