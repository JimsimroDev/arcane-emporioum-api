package uk.jimsimrodev.arcanemporiumapi.domain.auth.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.*;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.services.IUserService;

@RestController
@RequestMapping("/api/v1")
public class LoginController {

    private static final Logger LOGGER = LoggerFactory.getLogger(LoginController.class);
    @Autowired
    private IUserService userService;

    @PostMapping("/register")
    public Mono<UserResponse> register(@RequestBody UserRequest userRequest) {

        LOGGER.info("Datos recibidos {}", userRequest);

        return userService.register(userRequest);
    }

    @PostMapping("/login")
    public Mono<?> login(@RequestBody UserRequest userRequest, ServerWebExchange exchange) {

        LOGGER.info("Datos recibidos {}", userRequest);

        return userService.login(userRequest,exchange);

    }

    @PostMapping("/forgot-password")
    public Mono<?> forgotPassword(@RequestBody RequestPasswordReset requestPasswordReset) {

        return userService.forgotPassword(requestPasswordReset);
    }

    @PostMapping("/reset-password")
    public Mono<?> resetPassword(@RequestBody ResetPassword resetPassword) {

        return userService.resetPassword(resetPassword.newPassword(), resetPassword.token());
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Mono<String> admin() {
        return Mono.just("Acceso consedido como rol de administrador");
    }

    @GetMapping("/user")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public Mono<String> user() {
        return Mono.just("Acceso concedido como rol de usuario");
    }

    @GetMapping("/public")
    public Mono<String> publico() {
        return Mono.just("Acceso concedido para todo publico");
    }

    @PostMapping("/change-password")
    public Mono<?> changePassword(@RequestBody ChangePassword changePassword, Authentication authentication) {

        return userService.changePassword(authentication.getName(), changePassword.currentPassword(), changePassword.newPassword());
    }
}
