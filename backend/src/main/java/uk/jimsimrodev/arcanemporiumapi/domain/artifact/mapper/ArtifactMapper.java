package uk.jimsimrodev.arcanemporiumapi.domain.artifact.mapper;

import uk.jimsimrodev.arcanemporiumapi.domain.artifact.dto.ArtifactResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.Artifact;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.ArtifactTranslation;

import java.util.List;
import java.util.Locale;

public final class ArtifactMapper {

    private ArtifactMapper() {
    }

    // Entitiy ->DTO
    public static ArtifactResponse toResponse(Artifact artifact,
                                              List<ArtifactTranslation> translations,
                                              Locale locale,
                                              String priceFormatted,
                                              String currency) {

        ArtifactTranslation translation = findTranslation(translations, locale);

        return new ArtifactResponse(
                artifact.getId(),
                translation != null ? translation.getTitle() : artifact.getTitle(),
                translation != null ? translation.getDescription() : artifact.getDescription(),
                artifact.getPrice(),
                priceFormatted,
                currency,
                artifact.getRequiredLevel(),
                artifact.getInStock(),
                artifact.getCategory(),
                artifact.getRarity(),
                artifact.getImageUrl());
    }

    private static ArtifactTranslation findTranslation(List<ArtifactTranslation> translations, Locale locale) {
        return translations.stream()
                .filter(t -> locale.getLanguage().equals(t.getLocale()))
                .findFirst()
                .orElse(null);
    }
}
