package uk.jimsimrodev.arcanemporiumapi.domain.order.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.services.ArtifactService;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.Repositories.IUserRepository;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.model.Erole;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.model.UserEntity;
import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderRequest;
import uk.jimsimrodev.arcanemporiumapi.domain.order.dto.OrderResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.order.mapper.OrderMapper;
import uk.jimsimrodev.arcanemporiumapi.domain.order.model.OrderArtifact;
import uk.jimsimrodev.arcanemporiumapi.domain.order.model.OrderEntity;
import uk.jimsimrodev.arcanemporiumapi.domain.order.model.OrderStatus;
import uk.jimsimrodev.arcanemporiumapi.domain.order.repositories.IOrderArtifactRepository;
import uk.jimsimrodev.arcanemporiumapi.domain.order.repositories.IOrdersRepository;

import java.time.LocalDateTime;
import java.util.List;
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

        var response = userRepository.findByEmail(userEmail)
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

                                                .map(savedLine -> OrderMapper.toOrderResponse(
                                                        savedOrder,
                                                        List.of(OrderMapper.toOrderLineResponse(savedLine, artifact.title())),
                                                        userEmail
                                                ));
                                    });
                        }));



        return response;
    }

    @Override
    public Mono<Page<OrderResponse>> getAllOrders(Pageable pageable, String userEmail, Locale locale, String currency) {

        return userRepository.findByEmail(userEmail)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .flatMap(user -> {
                    boolean isAdmin = user.getRole() == Erole.ADMIN;

                    return Mono.zip(
                            isAdmin ? ordersRepository.count() : ordersRepository.countByUserId(user.getId()),
                            (isAdmin ? ordersRepository.findAllBy(pageable)
                                    : ordersRepository.findAllByUserId(user.getId(), pageable))
                                    .flatMap(order -> buildResponse(order, locale, currency, isAdmin ? null : user.getEmail()))
                                    .collectList()
                    );
                })
                .map(tuple -> new PageImpl<>(tuple.getT2(), pageable, tuple.getT1()));
    }

    private Mono<OrderResponse> buildResponse(OrderEntity order, Locale locale, String currency, String userEmail) {

        Mono<String> ownerEmail = userEmail != null
                ? Mono.just(userEmail)
                : userRepository.findById(order.getUserId())
                        .map(UserEntity::getEmail)
                        .defaultIfEmpty("");

        return ownerEmail.flatMap(email -> orderArtifactRepository.findByOrderId(order.getId())
                .flatMap(line -> artifactService.getArtifact(line.getArtifactId(), locale, currency)
                        .map(artifact -> OrderMapper.toOrderLineResponse(line, artifact.title())))
                .collectList()
                .map(lines -> OrderMapper.toOrderResponse(order, lines, email)));
    }

    @Override
    @Transactional
    public Mono<OrderResponse> updateOrder(Long orderId, String newStatus, Locale locale) {

        OrderStatus status;
        try {
            status = OrderStatus.valueOf(newStatus);
        } catch (IllegalArgumentException ex) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado inválido: " + newStatus));
        }

        return ordersRepository.findById(orderId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Orden no encontrada")))
                .flatMap(order -> {
                    order.setStatus(status);
                    return ordersRepository.save(order);
                })
                .flatMap(savedOrder -> userRepository.findById(savedOrder.getUserId())
                        .flatMap(owner -> buildResponse(savedOrder, locale, null, owner.getEmail())));
    }

    @Override
    @Transactional
    public Mono<OrderResponse> cancelOrder(Long orderId, String userEmail, Locale locale) {

        return userRepository.findByEmail(userEmail)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .flatMap(user -> ordersRepository.findById(orderId)
                        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Orden no encontrada")))
                        .flatMap(order -> {
                            if (!order.getUserId().equals(user.getId())) {
                                return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes cancelar un pedido ajeno"));
                            }
                            order.setStatus(OrderStatus.CANCELLED);
                            return ordersRepository.save(order);
                        }))
                .flatMap(savedOrder -> userRepository.findById(savedOrder.getUserId())
                        .flatMap(owner -> buildResponse(savedOrder, locale, null, owner.getEmail())));
    }
}
