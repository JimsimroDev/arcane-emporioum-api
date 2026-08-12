package uk.jimsimrodev.arcanemporiumapi.infra.currency;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExchangeRateQuote(
        LocalDate date,
        String base,
        String quote,
        BigDecimal rate) {

}