package uk.jimsimrodev.arcanemporiumapi.infra.currency;

import jakarta.annotation.PostConstruct;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ExchangeRateStore {
    private static final long REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

    private final ExchangeRateClient exchangeRateClient;

    private final Map<String, BigDecimal> rates = new ConcurrentHashMap<>();

    public ExchangeRateStore(ExchangeRateClient exchangeRateClient) {
        this.exchangeRateClient = exchangeRateClient;
    }

    @PostConstruct
    public void loadInitialRate() {
        refresh();
    }

    @Scheduled(fixedDelay = REFRESH_INTERVAL_MS)
    public void refresh() {
        exchangeRateClient.fetchRate("USD", "COP")
                .ifPresent(rate -> rates.put("USDCOP", rate));
        exchangeRateClient.fetchRate("BRL", "COP")
                .ifPresent(rate -> rates.put("BRLCOP", rate));
    }

    public Optional<BigDecimal> rate(String base, String quote) {
        return Optional.ofNullable(rates.get(base + quote));
    }

}
