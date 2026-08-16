package uk.jimsimrodev.arcanemporiumapi.domain.order.mapper;


import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.order.model.OrderEntity;

public final class OrderMapper {

    private OrderMapper() {
    }

    //Entity -> DTO
    public static OrderResponse toOrderResponse(OrderEntity orderResponse) {

        return new OrderResponse(
                orderResponse.getId(),
                orderResponse.getUserId(),
                orderResponse.getCreatedAt(),
                orderResponse.getStatus()
        );
    }
}
