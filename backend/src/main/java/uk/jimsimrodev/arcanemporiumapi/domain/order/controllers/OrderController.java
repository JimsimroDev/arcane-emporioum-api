package uk.jimsimrodev.arcanemporiumapi.domain.order.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderRequest;
import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.order.services.IOrderService;
import uk.jimsimrodev.arcanemporiumapi.domain.order.services.OrderServiceImpl;

import java.util.Locale;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final IOrderService orderService;

    @Autowired
    public OrderController(OrderServiceImpl orderService) {
        this.orderService = orderService;
    }

    @PostMapping()
    public Mono<OrderResponse> order(Authentication authentication,
                                     @RequestBody OrderRequest request, @RequestParam(defaultValue ="es") String lang) {

        return orderService.createOrder(authentication.getName(),request, Locale.forLanguageTag(lang));
    }
}
