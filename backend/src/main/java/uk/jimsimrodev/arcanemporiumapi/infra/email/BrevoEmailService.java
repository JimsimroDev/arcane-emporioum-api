package uk.jimsimrodev.arcanemporiumapi.infra.email;

import io.netty.resolver.DefaultAddressResolverGroup;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderResponse;
import uk.jimsimrodev.arcanemporiumapi.infra.email.dto.MailRequesDto;
import uk.jimsimrodev.arcanemporiumapi.infra.email.dto.MailResponse;
import uk.jimsimrodev.arcanemporiumapi.infra.email.dto.SenderDto;
import uk.jimsimrodev.arcanemporiumapi.infra.email.dto.ToDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BrevoEmailService implements IEmailService {
    private static final String BASE_URL = "https://api.brevo.com/v3";

    @Value("${brevo.api-key}")
    private String apiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    @Value("${brevo.sender.name}")
    private String senderName;

    private final WebClient webClient;

    public BrevoEmailService() {
        this.webClient = WebClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .clientConnector(new ReactorClientHttpConnector(
                        HttpClient.create().resolver(DefaultAddressResolverGroup.INSTANCE)))
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

        return webClient.post()
                .uri("/smtp/email")
                .header("api-key", apiKey)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(MailResponse.class)
                .then();
    }

    @Override
    public Mono<Void> sendEmail(String recipient,OrderResponse orderResponse) {

        String htmlContent =
                "<h2>¡Tu pedido ha sido creado! 🎉</h2>"
                        + "<p>Tu pedido se encuentra en estado: <strong>" + orderResponse.status().getStatus() + "</strong></p>"
                        + "<p><strong>Fecha:</strong> " + orderResponse.createdAt() + "</p>"
                        + "<h3>Detalle del pedido</h3>"
                        + "<p><strong>Total:</strong> $" + orderResponse.total() + "</p>"
                        + "<p><strong>Productos:</strong></p>"
                        + "<ul>"
                        + orderResponse.lines().stream()
                        .map(line -> "<li>"
                                + line.title()
                                + " - Cantidad: " + line.quantity()
                                + " - Precio: $" + line.unitPrice()
                                + "</li>")
                        .collect(Collectors.joining())
                        + "</ul>"
                        + "<p>Gracias por tu compra. Te avisaremos cuando haya novedades sobre tu pedido.</p>";

        String subject = "¡Tu pedido ha sido creado con éxito! 🎉";

        MailRequesDto payload = new MailRequesDto(
                htmlContent,
                new SenderDto(senderEmail, senderName),
                subject,
                List.of(new ToDto(recipient, recipient)));

        return webClient.post()
                .uri("/smtp/email")
                .header("api-key", apiKey)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(MailResponse.class)
                .then();
    }
}
