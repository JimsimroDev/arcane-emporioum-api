package uk.jimsimrodev.arcanemporiumapi.infra.i18n;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

import org.springframework.stereotype.Component;

@Component
public class PriceFormatted {

    public String format(BigDecimal amount, String currencyCode, Locale locale) {
        Locale numberLocale = switch (locale.getLanguage()) {
            case "en" -> Locale.US;
            case "es" -> Locale.of("es", "CO");
            case "pt" -> Locale.of("pt", "BR");
            default -> locale;
        };
        String number = NumberFormat.getNumberInstance(numberLocale).format(amount);
        return number + " " + currencyCode;

    }
}
