package uk.jimsimrodev.arcanemporiumapi.domain.artifact.repositories;

import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.Artifact;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.ECategory;

@Repository
public interface IArtifactRepository extends R2dbcRepository<Artifact, Long> {

    Flux<Artifact> findAllByOrderByIdAsc(Pageable pageable);

    Flux<Artifact> findAllByCategory(ECategory category, Pageable pageable);

    @Query("""
            SELECT * FROM artifacts
                    WHERE title ILIKE '%' || :keyword || '%'
                       OR description ILIKE '%' || :keyword || '%'
                       ORDER BY id ASC
                        LIMIT :size OFFSET :offset
            """)
    Flux<Artifact> searchByTitleOrDescription(
            @Param("keyword") String keyword,
            @Param("size") int size,
            @Param("offset") long offset);
}
