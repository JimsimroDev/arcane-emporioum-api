package uk.jimsimrodev.arcanemporiumapi.infra.i18n;

import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;

import java.util.Locale;

/**
 * Single seam for UI label resolution. Every class that needs a localized
 * label goes through this service instead of touching MessageSource directly,
 * so i18n behavior can be changed in one place.
 */
@Service
public class MessageService {

    private final MessageSource messageSource;

    public MessageService(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    /**
     * Resolves a label. If the code is missing it returns the code itself
     * (never throws), which makes missing keys visible instead of crashing.
     */
    public String label(String code, Object[] args, Locale locale) {
        return messageSource.getMessage(code, args, code, locale);
    }

    public String label(String code, Locale locale) {
        return label(code, null, locale);
    }
}
