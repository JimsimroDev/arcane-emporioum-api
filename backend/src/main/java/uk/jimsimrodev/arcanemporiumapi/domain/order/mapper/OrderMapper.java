package uk.jimsimrodev.arcanemporiumapi.domain.order.mapper;


import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderLineResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.order.model.OrderArtifact;
import uk.jimsimrodev.arcanemporiumapi.domain.order.model.OrderEntity;

import java.math.BigDecimal;
import java.util.List;

public final class OrderMapper {

    private OrderMapper() {
    }

    //Entity -> DTO
    public static OrderResponse toOrderResponse(OrderEntity order, List<OrderLineResponse> lines, String userEmail) {
        BigDecimal total = lines.stream()
                .map(OrderLineResponse::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new OrderResponse(
                order.getId(),
                order.getUserId(),
                userEmail,
                order.getCreatedAt(),
                order.getStatus(),
                total,
                lines
        );
    }

    public static OrderLineResponse toOrderLineResponse(OrderArtifact line, String title) {
        return new OrderLineResponse(
                line.getArtifactId(),
                title,
                line.getQuantity(),
                line.getUnitPrice(),
                line.getUnitPrice().multiply(BigDecimal.valueOf(line.getQuantity()))
        );
    }
}
