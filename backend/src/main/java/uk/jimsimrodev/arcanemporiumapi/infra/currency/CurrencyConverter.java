package uk.jimsimrodev.arcanemporiumapi.infra.currency;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

import org.springframework.stereotype.Component;

@Component
public class CurrencyConverter {

    private static final int SCALE = 2;

    private final ExchangeRateStore store;

    public CurrencyConverter(ExchangeRateStore store) {
        this.store = store;
    }

    public Optional<BigDecimal> convertFromCop(BigDecimal amountCop, String targetCurrency) {
        if (amountCop == null) {
            return Optional.empty();
        }
        if ("COP".equals(targetCurrency)) {
            return Optional.of(amountCop);
        }
        return store.rate(targetCurrency, "COP")
                .map(rate -> amountCop.divide(rate, SCALE, RoundingMode.HALF_UP));
    }
}