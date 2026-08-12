package uk.jimsimrodev.arcanemporiumapi.domain.artifact.services;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import uk.jimsimrodev.arcanemporiumapi.domain.artifact.dto.ArtifactResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.mapper.ArtifactMapper;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.Artifact;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.ECategory;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.repositories.IArtifactRepository;
import uk.jimsimrodev.arcanemporiumapi.infra.currency.CurrencyConverter;
import uk.jimsimrodev.arcanemporiumapi.infra.i18n.PriceFormatted;

@Service
public class ArtifactService implements IArtifactService {

    private IArtifactRepository artifactRepository;
    private PriceFormatted priceFormatted;
    private CurrencyConverter currencyConverter;

 

    public ArtifactService(IArtifactRepository artifactRepository, PriceFormatted priceFormatted,
            CurrencyConverter currencyConverter) {
        this.artifactRepository = artifactRepository;
        this.priceFormatted = priceFormatted;
        this.currencyConverter = currencyConverter;
    }

    @Override
    public Page<ArtifactResponse> getAllArtifact(Pageable pagination, Locale locale, String currency) {
        String displayCurrency = resolveCurrency(locale, currency);

        return artifactRepository.findAll(pagination)
                .map(artifact -> toResponse(artifact, locale, displayCurrency));

    }

    @Override
    public Optional<ArtifactResponse> getArtifact(Long id, Locale locale, String currency) {

        String displayCurrency = resolveCurrency(locale, currency);

        return artifactRepository.findWithTranslationsById(id)
                .map(artifact -> toResponse(artifact, locale, displayCurrency));

    }

    private String resolveCurrency(Locale locale, String requested) {
        if (requested != null && !requested.isBlank()) {
            return requested.toUpperCase(Locale.ROOT);
        }
        return switch (locale.getLanguage()) {
            case "en" -> "USD";
            case "pt" -> "BRL";
            default -> "COP";
        };
    }

    public ArtifactResponse toResponse(Artifact artifact, Locale locale, String displayCurrency) {
        Optional<BigDecimal> converted = currencyConverter.convertFromCop(artifact.getPrice(), displayCurrency);
        BigDecimal amount = converted.orElse(artifact.getPrice());
        String currency = converted.isPresent() ? displayCurrency : "COP";

        return ArtifactMapper.toResponse(artifact,locale,
                priceFormatted.format(amount,currency,locale),currency);
    }



    @Override
    public Page<ArtifactResponse> getArtifactCategorList(Pageable pagination, ECategory category, Locale locale,
            String currency) {
        String displayCurrency = resolveCurrency(locale, currency);
        return artifactRepository.findALLByCategory(pagination, category)
                .map(artifact -> toResponse(artifact, locale, displayCurrency));
    }

    @Override
    public Page<ArtifactResponse> searchByKeyword(Pageable pagination, String keyword, Locale locale, String currency) {
        String displayCurrency = resolveCurrency(locale, currency);
        return artifactRepository.searchByTitleOrDescription(pagination, keyword)
                .map(artifact -> toResponse(artifact, locale, displayCurrency));
    }

}
