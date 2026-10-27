package uk.jimsimrodev.arcanemporiumapi.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.i18n.LocaleContext;
import org.springframework.context.i18n.SimpleLocaleContext;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.i18n.AcceptHeaderLocaleContextResolver;
import org.springframework.web.server.i18n.LocaleContextResolver;

import java.util.List;
import java.util.Locale;

@Configuration
public class LocaleConfig {

    @Bean
    public LocaleContextResolver localeContextResolver() {
        return new QueryParamLocaleContextResolver();
    }

    static class QueryParamLocaleContextResolver implements LocaleContextResolver {

        private static final List<String> SUPPORTED = List.of("es", "en", "pt");

        private final AcceptHeaderLocaleContextResolver fallback = new AcceptHeaderLocaleContextResolver();

        @Override
        public LocaleContext resolveLocaleContext(ServerWebExchange exchange) {
            String lang = exchange.getRequest().getQueryParams().getFirst("lang");
            if (lang != null && SUPPORTED.contains(lang)) {
                return new SimpleLocaleContext(Locale.forLanguageTag(lang));
            }
            LocaleContext localeContext = fallback.resolveLocaleContext(exchange);
            Locale locale = localeContext.getLocale();
            if (locale == null) {
                return new SimpleLocaleContext(Locale.ENGLISH);
            }
            return localeContext;
        }

        @Override
        public void setLocaleContext(ServerWebExchange exchange, LocaleContext localeContext) {
            fallback.setLocaleContext(exchange, localeContext);
        }
    }

}
