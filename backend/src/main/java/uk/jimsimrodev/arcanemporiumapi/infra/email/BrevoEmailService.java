package uk.jimsimrodev.arcanemporiumapi.infra.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.infra.email.dto.MailRequesDto;
import uk.jimsimrodev.arcanemporiumapi.infra.email.dto.SenderDto;
import uk.jimsimrodev.arcanemporiumapi.infra.email.dto.ToDto;

import java.util.List;

@Service
public class BrevoEmailService implements IEmailService {
    private static final String BASE_URL = "https://api.brevo.com/v3";

    @Value("${brevo.api-key}")
    private String apiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    @Value("${brevo.sender.name}")
    private String senderName;

    private final RestClient restClient;

    public BrevoEmailService() {
        this.restClient = RestClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public Mono<Void> resetPassword(String recipient, String token) {

        String resetLink = "http://localhost:5173/reset-password?token=" + token;

        MailRequesDto payload = new MailRequesDto(
                "<p>Haz clic aquí para restablecer tu contraseña:</p>"
                        + "<a href=\"" + resetLink + "\">Restablecer contraseña</a>",
                new SenderDto(senderEmail, senderName),
                "Recuperación de contraseña",
                List.of(new ToDto(recipient, recipient)));

        restClient.post()
                .uri("/smtp/email")
                .header("api-key", apiKey)
                .body(payload)
                .retrieve()
                .toBodilessEntity();
        return null;
    }
}
