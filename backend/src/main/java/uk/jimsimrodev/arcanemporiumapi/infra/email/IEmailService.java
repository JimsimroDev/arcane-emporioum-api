package uk.jimsimrodev.arcanemporiumapi.infra.email;

import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderResponse;

public interface IEmailService {
    Mono<Void> resetPassword(String recipient, String token);

    Mono<Void> sendEmail(String recipient, OrderResponse orderResponse);
}
