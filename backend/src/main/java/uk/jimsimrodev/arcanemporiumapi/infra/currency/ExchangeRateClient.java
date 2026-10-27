package uk.jimsimrodev.arcanemporiumapi.infra.currency;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Component
public class ExchangeRateClient {
    private static final String BASE_URL = "https://api.frankfurter.dev/v2";

    private final RestClient restClient;

    public ExchangeRateClient() {
        this.restClient = RestClient.create(BASE_URL);
    }

    public Optional<BigDecimal> fetchRate(String base, String quote) {
        try {
            List<ExchangeRateQuote> quotes = restClient.get()
                    .uri("/rates?base={base}&quotes={quote}", base, quote)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });

            return quotes == null || quotes.isEmpty()
                    ? Optional.empty()
                    : Optional.of(quotes.get(0).rate());
        } catch (RestClientException ex) {
            return Optional.empty();
        }
    }

}
