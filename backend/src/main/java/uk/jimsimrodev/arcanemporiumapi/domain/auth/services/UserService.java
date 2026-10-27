package uk.jimsimrodev.arcanemporiumapi.domain.auth.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.context.ServerSecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.Repositories.IUserRepository;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.RequestPasswordReset;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.UserRequest;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.UserResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.mapper.UserMapper;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.model.Erole;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.model.UserEntity;
import uk.jimsimrodev.arcanemporiumapi.infra.email.IEmailService;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserService implements IUserService {

    private static final Logger LOGGER = LoggerFactory.getLogger(UserService.class);

    private final IUserRepository userRepository;
    private final IEmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final ReactiveAuthenticationManager authenticationManager;
    private final ServerSecurityContextRepository securityContextRepository;

    @Autowired
    public UserService(IUserRepository userRepository, IEmailService emailService, PasswordEncoder passwordEncoder,
                       ReactiveAuthenticationManager authenticationManager, ServerSecurityContextRepository securityContextRepository) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
    }

    @Override
    public Mono<Void> forgotPassword(RequestPasswordReset requestPasswordReset) {

        return userRepository.findByEmail(requestPasswordReset.email())
                .switchIfEmpty(Mono.error(new RuntimeException("Si el correo existe, recibirás un enlace")))
                .flatMap(user -> {
                    String token = UUID.randomUUID().toString();
                    user.setResetToken(token);
                    user.setTokenResetPasswordExpiresAt(LocalDateTime.now().plusMinutes(15));
                    return userRepository.save(user)
                            .then(Mono.fromRunnable(() -> emailService.resetPassword(requestPasswordReset.email(), token)));
                });
    }

    @Override
    public Mono<Void> resetPassword(String newPassword, String token) {

        return userRepository.findByResetToken(token)
                .switchIfEmpty(Mono.error(new RuntimeException("Token expirado o inválido")))
                .flatMap(user -> {
                    if (user.getTokenResetPasswordExpiresAt().isBefore(LocalDateTime.now())) {
                        return Mono.error(new RuntimeException("Token expirado"));
                    }
                    user.setPassword(passwordEncoder.encode(newPassword));
                    user.setResetToken(null);
                    return userRepository.save(user);
                }).then();
    }

    @Override
    public Mono<UserResponse> register(UserRequest userRequest) {

        UserEntity user = UserMapper.toEntity(
                userRequest,
                passwordEncoder.encode(userRequest.password()),
                Erole.USER);

        return userRepository.save(user).map(UserMapper::toResponse);
    }

    @Override
    public Mono<UserResponse> login(UserRequest userRequest, ServerWebExchange exchange) {

        return authenticationManager
                .authenticate(new UsernamePasswordAuthenticationToken(userRequest.email(), userRequest.password()))
                .flatMap(authentication -> securityContextRepository
                        .save(exchange,new SecurityContextImpl(authentication))
                        .then(userRepository.findByEmail(authentication.getName())
                                .map(UserMapper::toResponse)));
    }

    @Override
    public Mono<PageImpl<UserResponse>> getAllUsers(Pageable pageable) {

        return userRepository.countByActiveTrue()
                .zipWith(userRepository.findAllByActiveTrue(pageable).collectList())
                .map(tuple -> new PageImpl<>(
                        tuple.getT2().stream().map(UserMapper::toResponse).toList(),
                        pageable,
                        tuple.getT1()));

    }

    @Override
    public Mono<UserResponse> updateRole(Long id, String newRole) {

        return userRepository.findById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("Usuario no encontrado id: " + id)))
                .flatMap(user -> ensureNotLastAdmin(user)
                        .thenReturn(user)
                        .flatMap(u -> {
                            u.setRole(Erole.fromRole(newRole));
                            return userRepository.save(u).map(UserMapper::toResponse);
                        }));
    }

    @Override
    public Mono<Void> changePassword(String email, String currentPassword, String newPassword) {

        return userRepository.findByEmail(email)
                .switchIfEmpty(Mono.error(new RuntimeException("Usuario no encontrado")))
                .flatMap(user -> {
                    if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                        LOGGER.error("Las contraseñas no coinciden");
                      return Mono.error(new RuntimeException("Las contraseñs no coinciden"));
                    }
                    user.setPassword(passwordEncoder.encode(newPassword));
                    return userRepository.save(user);
                }).then();
    }

    @Override
    public Mono<Void> deleteUser(Long id) {

        return userRepository.findById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("Usuario no encontrado id: " + id)))
                .flatMap(user -> ensureNotLastAdmin(user)
                        .thenReturn(user)
                        .flatMap(u -> {
                            u.setActive(false);
                            return userRepository.save(u);
                        })).then();
    }

    private Mono<Void> ensureNotLastAdmin(UserEntity target) {
        if (target.getRole() != Erole.ADMIN) {
            return Mono.empty();
        }
        
        return userRepository.countByRole(Erole.ADMIN)
                .flatMap(count -> count <= 1
                        ? Mono.error(new RuntimeException("Debe existir almenos un administrador"))
                        : Mono.empty());

    }
}
