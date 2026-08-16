package uk.jimsimrodev.arcanemporiumapi.domain.order.repositories;

import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import uk.jimsimrodev.arcanemporiumapi.domain.order.model.OrderArtifact;

public interface IOrderArtifactRepository extends R2dbcRepository<OrderArtifact, Long> {
    Flux<OrderArtifact> findByOrderId(Long orderId);

}
