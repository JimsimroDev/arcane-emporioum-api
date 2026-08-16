package uk.jimsimrodev.arcanemporiumapi.domain.order.dto;

import uk.jimsimrodev.arcanemporiumapi.domain.order.model.OrderStatus;

import java.time.LocalDateTime;

public record OrderResponse(
        Long id,
        Long userId,
        LocalDateTime createdAt,
        OrderStatus status
) {
}
