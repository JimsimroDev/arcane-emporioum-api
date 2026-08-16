package uk.jimsimrodev.arcanemporiumapi.domain.order.dto;

import uk.jimsimrodev.arcanemporiumapi.domain.order.model.OrderStatus;

import java.time.LocalDateTime;

public record OrderRequest(
        Long artifactId,
        Long quantity
) {
}
