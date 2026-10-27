package uk.jimsimrodev.arcanemporiumapi.domain.favorites.repositories;

import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.favorites.model.Favorite;

@Repository
public interface IFavoriteRepository extends R2dbcRepository<Favorite, Long> {

    Flux<Favorite> findAllByUserId(Long userId, Pageable pageable);

    Mono<Boolean> existsByUserIdAndArtifactId(Long userId, Long artifactId);

    Mono<Void> deleteByUserIdAndArtifactId(Long userId, Long artifactId);

}
