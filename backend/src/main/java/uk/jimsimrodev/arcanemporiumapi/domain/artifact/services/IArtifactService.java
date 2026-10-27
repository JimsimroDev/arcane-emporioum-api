package uk.jimsimrodev.arcanemporiumapi.domain.artifact.services;

import org.springframework.data.domain.Pageable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.dto.ArtifactResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.ECategory;

import java.util.Locale;

public interface IArtifactService {

    Flux<ArtifactResponse> getAllArtifact(Pageable pageable, Locale locale, String currency);

    Mono<ArtifactResponse> getArtifact(Long id, Locale locale, String currency);

    Flux<ArtifactResponse> getArtifactCategorList(Pageable pageable, ECategory category, Locale locale,
                                                  String currency);

    Flux<ArtifactResponse> searchByKeyword(Pageable pageable, String keyword, Locale locale, String currency);

}
