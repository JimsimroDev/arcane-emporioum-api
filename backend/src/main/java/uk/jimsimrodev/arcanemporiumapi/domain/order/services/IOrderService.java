package uk.jimsimrodev.arcanemporiumapi.domain.order.services;

import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderRequest;
import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderResponse;

import java.util.Locale;

public interface IOrderService {

     Mono<OrderResponse> createOrder(String userEmail, OrderRequest orderRequest, Locale locale);
}
