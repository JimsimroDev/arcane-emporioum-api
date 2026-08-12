package uk.jimsimrodev.arcanemporiumapi.domain.favorites.repositories;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uk.jimsimrodev.arcanemporiumapi.domain.favorites.model.Favorite;

@Repository
public interface IFavoriteRepository extends JpaRepository<Favorite, Long> {

    @EntityGraph(attributePaths = { "artifact", "artifact.translations" })
    Page<Favorite> findAllByUser_IdOrderByCreatedAtDesc(Pageable pagination, Long userId);

    boolean existsByUser_IdAndArtifact_Id(Long userId, Long artifactId);

    Optional<Favorite> findByUser_IdAndArtifact_Id(Long userId, Long artifactId);

    void deleteByUser_IdAndArtifact_Id(Long userId, Long artifactId);

}
