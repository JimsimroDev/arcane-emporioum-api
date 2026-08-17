package uk.jimsimrodev.arcanemporiumapi.domain.order.services;

import org.springframework.data.domain.Page;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderRequest;
import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderResponse;
import org.springframework.data.domain.Pageable;

import java.util.Locale;

public interface IOrderService {

    Mono<OrderResponse> createOrder(String userEmail, OrderRequest orderRequest, Locale locale);

    Mono<Page<OrderResponse>> getAllOrders(Pageable pageable, String userEmail, Locale locale, String currency);

    Mono<OrderResponse> updateOrder(Long orderId, String newStatus, Locale locale);

    Mono<OrderResponse> cancelOrder(Long orderId, String userEmail, Locale locale);
}
