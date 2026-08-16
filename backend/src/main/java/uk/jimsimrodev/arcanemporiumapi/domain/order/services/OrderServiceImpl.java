package uk.jimsimrodev.arcanemporiumapi.domain.order.services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.services.ArtifactService;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.Repositories.IUserRepository;
import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderRequest;
import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.order.mapper.OrderMapper;
import uk.jimsimrodev.arcanemporiumapi.domain.order.model.OrderArtifact;
import uk.jimsimrodev.arcanemporiumapi.domain.order.model.OrderEntity;
import uk.jimsimrodev.arcanemporiumapi.domain.order.model.OrderStatus;
import uk.jimsimrodev.arcanemporiumapi.domain.order.repositories.IOrderArtifactRepository;
import uk.jimsimrodev.arcanemporiumapi.domain.order.repositories.IOrdersRepository;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class OrderServiceImpl implements IOrderService {

    private final IUserRepository userRepository;
    private final ArtifactService artifactService;
    private final IOrdersRepository ordersRepository;
    private final IOrderArtifactRepository orderArtifactRepository;

    public OrderServiceImpl(IUserRepository userRepository,
                            ArtifactService artifactService,
                            IOrdersRepository ordersRepository,
                            IOrderArtifactRepository orderArtifactRepository) {

        this.userRepository = userRepository;
        this.artifactService = artifactService;
        this.ordersRepository = ordersRepository;
        this.orderArtifactRepository = orderArtifactRepository;
    }

    @Transactional
    @Override
    public Mono<OrderResponse> createOrder(String userEmail, OrderRequest orderRequest, Locale locale) {

        return userRepository.findByEmail(userEmail)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .flatMap(user -> artifactService.getArtifact(orderRequest.artifactId(), locale, null)
                        .flatMap(artifact -> {
                            OrderEntity order = new OrderEntity();
                            order.setCreatedAt(LocalDateTime.now());
                            order.setStatus(OrderStatus.PREPARING);
                            order.setUserId(user.getId());

                            return ordersRepository.save(order)
                                    .flatMap(savedOrder -> {
                                        long quantity = orderRequest.quantity() != null ? orderRequest.quantity() : 1L;

                                        OrderArtifact line = new OrderArtifact();
                                        line.setOrderId(savedOrder.getId());
                                        line.setArtifactId(orderRequest.artifactId());
                                        line.setQuantity(quantity);
                                        line.setUnitPrice(artifact.price());

                                        return orderArtifactRepository.save(line)
                                                .thenReturn(OrderMapper.toOrderResponse(savedOrder));

                                    });
                        }));
    }
}
