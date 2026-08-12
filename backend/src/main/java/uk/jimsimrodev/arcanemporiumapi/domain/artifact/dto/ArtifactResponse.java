package uk.jimsimrodev.arcanemporiumapi.domain.artifact.dto;

import java.math.BigDecimal;

import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.ECategory;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.ERarity;

public record ArtifactResponse(
        Long id,
        String title,
        String description,
        BigDecimal price,
        String priceFormatted,
        String currency,
        Integer requiredLevel,
        Boolean inStock,
        ECategory category,
        ERarity rarity,
        String imageUrl) {
}
