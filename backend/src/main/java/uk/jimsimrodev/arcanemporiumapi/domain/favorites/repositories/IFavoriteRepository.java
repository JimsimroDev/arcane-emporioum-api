package uk.jimsimrodev.arcanemporiumapi.domain.favorites.repositories;

import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.favorites.model.Favorite;

@Repository
public interface IFavoriteRepository extends ReactiveCrudRepository<Favorite, Long> {

    Flux<Favorite> findAllByUser_IdOrderByCreatedAtDesc(Pageable pageable, Long userId);

    Mono<Boolean> existsByUser_IdAndArtifact_Id(Long userId, Long artifactId);

    Mono<Favorite> findByUser_IdAndArtifact_Id(Long userId, Long artifactId);

    Mono<Void> deleteByUser_IdAndArtifact_Id(Long userId, Long artifactId);

}
