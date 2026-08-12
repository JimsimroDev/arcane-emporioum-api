package uk.jimsimrodev.arcanemporiumapi.domain.artifact.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

import reactor.core.publisher.Flux;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.Artifact;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.ECategory;

@Repository
public interface IArtifactRepository extends ReactiveCrudRepository<Artifact, Long> {

        Flux<Artifact> findAll(Pageable pageable);

        Page<Artifact> findAllByCategory(Pageable pageable, ECategory category);

        @Query("""
                        SELECT a FROM Artifact a
                        WHERE LOWER(a.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                           OR LOWER(a.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
                           OR EXISTS (
                               SELECT 1 FROM ArtifactTranslation t
                               WHERE t.artifact = a
                                 AND (LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                                   OR LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
                           )
                        """)
        Flux<Artifact> searchByTitleOrDescription(@Param("keyword") String keyword);
}
