package uk.jimsimrodev.arcanemporiumapi.domain.order.dto;

public record OrderRequest(
        Long artifactId,
        Long quantity
) {
}
