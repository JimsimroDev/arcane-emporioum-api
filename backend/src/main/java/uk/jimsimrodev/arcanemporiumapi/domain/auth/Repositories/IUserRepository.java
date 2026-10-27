package uk.jimsimrodev.arcanemporiumapi.domain.auth.Repositories;

import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.model.Erole;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.model.UserEntity;

@Repository
public interface IUserRepository extends R2dbcRepository<UserEntity, Long> {

    Flux<UserEntity> findAllByActiveTrue(Pageable pageable);

    Mono<Long> countByActiveTrue();

    Mono<UserEntity> findByEmail(String email);

    Mono<UserEntity> findByResetToken(String token);

    Mono<Long> countByRole(Erole role);
}
