package uk.jimsimrodev.arcanemporiumapi.domain.auth.services;

import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.RequestPasswordReset;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.UserRequest;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.UserResponse;

public interface IUserService {

    Mono<UserResponse> register(UserRequest userRequest);

    Mono<UserResponse> login(UserRequest userRequest, ServerWebExchange exchange);

    Mono<PageImpl<UserResponse>> getAllUsers(Pageable pageable);

    Mono<UserResponse> updateRole(Long id, String newRole);

    Mono<Void> forgotPassword(RequestPasswordReset requestPasswordReset);

    Mono<Void> resetPassword(String newPassword, String token);

    Mono<Void> changePassword(String email, String currentPassword, String newPassword);

    Mono<Void> deleteUser(Long id);

}
