package uk.jimsimrodev.arcanemporiumapi.domain.order.dto;

import uk.jimsimrodev.arcanemporiumapi.domain.order.model.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        Long userId,
        String userEmail,
        LocalDateTime createdAt,
        OrderStatus status,
        BigDecimal total,
        List<OrderLineResponse> lines
) {
}
