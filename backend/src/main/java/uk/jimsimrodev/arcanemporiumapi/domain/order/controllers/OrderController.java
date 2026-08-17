package uk.jimsimrodev.arcanemporiumapi.domain.order.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderRequest;
import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderStatusRequest;
import uk.jimsimrodev.arcanemporiumapi.domain.order.services.IOrderService;
import uk.jimsimrodev.arcanemporiumapi.domain.order.services.OrderServiceImpl;
import uk.jimsimrodev.arcanemporiumapi.infra.email.BrevoEmailService;

import java.util.Locale;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private static final Logger LOGGER = LoggerFactory.getLogger(OrderController.class);

    private final IOrderService orderService;
    private final BrevoEmailService brevoEmailService;

    @Autowired
    public OrderController(OrderServiceImpl orderService,
                           BrevoEmailService brevoEmailService) {

        this.orderService = orderService;
        this.brevoEmailService = brevoEmailService;
    }

    @PostMapping()
    public Mono<OrderResponse> order(Authentication authentication,
                                     @RequestBody OrderRequest request, @RequestParam(defaultValue = "es") String lang) {

        return orderService.createOrder(authentication.getName(), request, Locale.forLanguageTag(lang))
                .flatMap(orderResponse ->
                        brevoEmailService.sendEmail(authentication.getName(),orderResponse)
                                .subscribeOn(Schedulers.boundedElastic())
                                .onErrorResume(ex ->{
                                    LOGGER.error("No se pudo enviar el correo del pedido {}: {}",orderResponse.id(), ex);
                                    return Mono.empty();
                                })
                                .thenReturn(orderResponse));
    }


    @GetMapping()
    public Mono<Page<OrderResponse>> getMyOrders(Authentication authentication,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "10") int size,
                                                 @RequestParam(defaultValue = "es") String lang,
                                                 @RequestParam(required = false) String currency) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return orderService.getAllOrders(pageable, authentication.getName(), Locale.forLanguageTag(lang), currency);
    }

    @PatchMapping("/{orderId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Mono<OrderResponse> updateOrder(@PathVariable Long orderId, @RequestBody OrderStatusRequest request,
                                           @RequestParam(defaultValue = "es") String lang) {

        return orderService.updateOrder(orderId, request.newStatus(), Locale.forLanguageTag(lang));
    }

    @PostMapping("/{orderId}/cancel")
    public Mono<OrderResponse> cancelOrder(@PathVariable Long orderId, Authentication authentication,
                                           @RequestParam(defaultValue = "es") String lang) {

        return orderService.cancelOrder(orderId, authentication.getName(), Locale.forLanguageTag(lang));
    }
}
