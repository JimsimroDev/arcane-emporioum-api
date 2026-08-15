package uk.jimsimrodev.arcanemporiumapi.domain.artifact.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.dto.ArtifactResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.mapper.ArtifactMapper;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.ArtifactTranslation;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.ECategory;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.repositories.IArtifactRepository;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.repositories.IArtifactTranslationRepository;
import uk.jimsimrodev.arcanemporiumapi.infra.i18n.PriceFormatted;

import java.util.List;
import java.util.Locale;

@Service
public class ArtifactService implements IArtifactService {

    private final IArtifactRepository artifactRepository;
    private final PriceFormatted priceFormatted;
    private final IArtifactTranslationRepository artifactTranslationRepository;

    @Autowired
    public ArtifactService(IArtifactRepository artifactRepository, PriceFormatted priceFormatted,
                           IArtifactTranslationRepository artifactTranslationRepository) {
        this.artifactRepository = artifactRepository;
        this.priceFormatted = priceFormatted;
        this.artifactTranslationRepository = artifactTranslationRepository;
    }

    @Override
    public Flux<ArtifactResponse> getAllArtifact(Pageable pageable, Locale locale, String currency) {

        String displayCurrency = resolveCurrency(locale, currency);

        return artifactTranslationRepository.findAll()
                .collectList()
                .flatMapMany(translation -> artifactRepository.findAllByOrderByIdAsc(pageable)
                        .map(artifact -> ArtifactMapper.toResponse(
                                artifact,
                                translationFor(artifact.getId(), translation),
                                locale,
                                priceFormatted.format(artifact.getPrice(), displayCurrency, locale),
                                displayCurrency))
                );
    }

    private static List<ArtifactTranslation> translationFor(Long artifacId,
                                                            List<ArtifactTranslation> translation) {

        return translation.stream().filter(t -> artifacId.equals(t.getArtifactId())).toList();
    }

    @Override
    public Mono<ArtifactResponse> getArtifact(Long id, Locale locale, String currency) {

        String displayCurrency = resolveCurrency(locale, currency);

        return artifactRepository.findById(id)
                .flatMap(artifact -> artifactTranslationRepository
                        .findAllByArtifactId(artifact.getId())
                        .collectList()
                        .map(translations -> ArtifactMapper.toResponse(
                                artifact, translations, locale,
                                priceFormatted.format(artifact.getPrice(), displayCurrency, locale),
                                displayCurrency)))
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Artefacto no encotrado")));

    }

    private String resolveCurrency(Locale locale, String requested) {
        if (requested != null && !requested.isBlank()) {
            return requested.toUpperCase(Locale.ROOT);
        }
        Locale safe = (locale != null) ? locale : Locale.ENGLISH;
        return switch (safe.getLanguage()) {
            case "en" -> "USD";
            case "pt" -> "BRL";
            default -> "COP";
        };
    }

    @Override
    public Flux<ArtifactResponse> getArtifactCategorList(Pageable pageable, ECategory category, Locale locale,
                                                         String currency) {

        String displayCurrency = resolveCurrency(locale, currency);

        return artifactTranslationRepository.findAll()
                .collectList()
                .flatMapMany(translation -> artifactRepository.findAllByCategory(category, pageable)
                        .map(artifact -> ArtifactMapper.toResponse(
                                artifact,
                                translationFor(artifact.getId(), translation),
                                locale,
                                priceFormatted.format(artifact.getPrice(), displayCurrency, locale),
                                displayCurrency))
                );
    }

    @Override
    public Flux<ArtifactResponse> searchByKeyword(Pageable pageable, String keyword, Locale locale, String currency) {

        String displayCurrency = resolveCurrency(locale, currency);

        return artifactTranslationRepository.findAll()
                .collectList()
                .flatMapMany(translation -> artifactRepository
                        .searchByTitleOrDescription(keyword, pageable.getPageSize(), pageable.getOffset())
                        .map(artifact -> ArtifactMapper.toResponse(
                                artifact,
                                translationFor(artifact.getId(), translation),
                                locale,
                                priceFormatted.format(artifact.getPrice(), displayCurrency, locale),
                                displayCurrency))
                );
    }
}
