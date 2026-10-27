package uk.jimsimrodev.arcanemporiumapi.domain.order.dto;

import java.math.BigDecimal;

public record OrderLineResponse(
        Long artifactId,
        String title,
        Long quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {
}
