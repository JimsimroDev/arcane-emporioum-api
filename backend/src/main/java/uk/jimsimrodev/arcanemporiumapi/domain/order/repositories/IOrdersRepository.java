package uk.jimsimrodev.arcanemporiumapi.domain.order.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.order.model.OrderEntity;



public interface IOrdersRepository extends R2dbcRepository<OrderEntity, Long> {

    Flux<OrderEntity> findAllBy(Pageable pageable);

    Flux<OrderEntity> findAllByUserId(Long userId, Pageable pageable);

    Mono<Long> countByUserId(Long id);
}
