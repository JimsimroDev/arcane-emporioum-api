package uk.jimsimrodev.arcanemporiumapi.domain.artifact.repositories;

import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.ArtifactTranslation;

public interface IArtifactTranslationRepository extends R2dbcRepository<ArtifactTranslation, Long> {

    Flux<ArtifactTranslation> findAllByArtifactId(Long id);
}
