package uk.jimsimrodev.arcanemporiumapi.domain.artifact.mapper;

import java.util.Locale;
import java.util.Optional;

import uk.jimsimrodev.arcanemporiumapi.domain.artifact.dto.ArtifactResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.Artifact;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.ArtifactTranslation;

public final class ArtifactMapper {

    private ArtifactMapper() {
    }

    // Entitiy ->DTO
    public static ArtifactResponse toResponse(Artifact artifact, Locale locale, String priceFormatted,
            String currency) {

        return new ArtifactResponse(
                artifact.getId(),
                resolveTitle(artifact, locale),
                resolveDescription(artifact, locale),
                artifact.getPrice(),
                priceFormatted,
                currency,
                artifact.getRequiredLevel(),
                artifact.getInStock(),
                artifact.getCategory(),
                artifact.getRarity(),
                artifact.getImageUrl());
    }

    private static String resolveTitle(Artifact artifact, Locale locale) {
        return resolveTranslation(artifact, locale)
                .map(ArtifactTranslation::getTitle)
                .orElse(artifact.getTitle());
    }

    private static String resolveDescription(Artifact artifact, Locale locale) {
        return resolveTranslation(artifact, locale)
                .map(ArtifactTranslation::getDescription)
                .orElse(artifact.getDescription());
    }

    private static Optional<ArtifactTranslation> resolveTranslation(Artifact artifact, Locale locale) {
        return artifact.getTranslations().stream()
                .filter(t -> locale.getLanguage().equals(t.getLocale()))
                .findFirst();
    }
}
