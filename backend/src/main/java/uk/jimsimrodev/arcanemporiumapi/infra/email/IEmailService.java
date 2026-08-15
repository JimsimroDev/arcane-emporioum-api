package uk.jimsimrodev.arcanemporiumapi.infra.email;

import reactor.core.publisher.Mono;

public interface IEmailService {
    Mono<Void> resetPassword(String recipient, String token);
}
