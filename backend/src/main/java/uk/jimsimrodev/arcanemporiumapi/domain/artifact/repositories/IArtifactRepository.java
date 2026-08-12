package uk.jimsimrodev.arcanemporiumapi.domain.artifact.repositories;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.Artifact;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.ECategory;

@Repository
public interface IArtifactRepository extends JpaRepository<Artifact, Long> {

        @EntityGraph(attributePaths = "translations")
        Page<Artifact> findAll(Pageable pagination);

        @EntityGraph(attributePaths = "translations")
        @Query("SELECT a FROM Artifact a WHERE a.id = :id")
        Optional<Artifact> findWithTranslationsById(@Param("id") Long id);

        @EntityGraph(attributePaths = "translations")
        Page<Artifact> findALLByCategory(Pageable pagination, ECategory category);

        @EntityGraph(attributePaths = "translations")
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
        Page<Artifact> searchByTitleOrDescription(Pageable pagination, @Param("keyword") String keyword);
}
