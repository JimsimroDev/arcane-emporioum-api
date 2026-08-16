package uk.jimsimrodev.arcanemporiumapi.domain.order.repositories;

import org.springframework.data.r2dbc.repository.R2dbcRepository;
import uk.jimsimrodev.arcanemporiumapi.domain.order.model.OrderEntity;

public interface IOrdersRepository extends R2dbcRepository<OrderEntity, Long> {

}
