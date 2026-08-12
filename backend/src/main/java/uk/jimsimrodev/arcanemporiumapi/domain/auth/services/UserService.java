package uk.jimsimrodev.arcanemporiumapi.domain.auth.services;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.Repositories.IUserRepository;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.RequestPasswordReset;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.UserRequest;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.UserResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.mapper.UserMapper;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.model.Erole;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.model.UserEntity;
import uk.jimsimrodev.arcanemporiumapi.infra.email.IEmailService;

@Service
public class UserService implements IUserService {

    private IUserRepository userRepository;
    private IEmailService emailService;
    private PasswordEncoder passwordEncoder;
    private AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;

    public UserService(IUserRepository userRepository, IEmailService emailService, PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager, SecurityContextRepository securityContextRepository) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
    }

    @Override
    public void forgotPassword(RequestPasswordReset requestPasswordReset) {

        UserEntity user = userRepository.findByEmail(requestPasswordReset.email())
                .orElseThrow(() -> new RuntimeException("Si el correo existe, recibirás un enlace"));

        String token = UUID.randomUUID().toString();
        user.setResetToken(token);

        user.setTokenResetPasswordExpiresAt(LocalDateTime.now().plusMinutes(15));

        userRepository.save(user);

        emailService.resetPassword(requestPasswordReset.email(), token);

    }

    @Override
    public void resetPassword(String newPassword, String token) {

        UserEntity user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Token expirado o inválido"));

        if (user.getTokenResetPasswordExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expirado");
        }

        user.setPassword(passwordEncoder.encode(newPassword));

        user.setResetToken(null);

        userRepository.save(user);
    }

    @Override
    public UserResponse register(UserRequest userRequest) {

        String passwordEncript = passwordEncoder.encode(userRequest.password());

        UserEntity user = UserMapper.toEntity(
                userRequest,
                passwordEncript,
                Erole.USER);

        userRepository.save(user);

        return UserMapper.toResponse(user);
    }

    @Override
    public UserResponse login(UserRequest userRequest, HttpServletRequest request, HttpServletResponse response) {

        Authentication authentication = authenticationManager
                .authenticate(
                        new UsernamePasswordAuthenticationToken(
                                userRequest.email(),
                                userRequest.password()));

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);

        System.out.println("se logro la utenticacion " + authentication.getName());

        UserEntity user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario o clave incorrecta"));

        return UserMapper.toResponse(user);

    }

    @Override
    public Flux<UserResponse> getAllUsers(Pageable pagination) {
        return Flux.fromIterable(userRepository.findAllByActiveTrue(pagination).map(UserMapper::toResponse));
    }

    @Override
    public UserResponse updateRole(Long id, String newRole) {

        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado id: " + id));

        ensureNotLastAdmin(user);

        user.setRole(Erole.fromRole(newRole));
        userRepository.save(user);
        return UserMapper.toResponse(user);
    }

    @Override
    public void changePassword(String email, String currentPassword, String newPassword) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Las contraseñas no coinciden");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Override
    public void deleteUser(Long id) {

        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado id: " + id));
                
        ensureNotLastAdmin(user);
        user.setActive(false);
        userRepository.save(user);
    }

    private void ensureNotLastAdmin(UserEntity target) {
        if (target.getRole() == Erole.ADMIN && userRepository.countByRole(Erole.ADMIN) <= 1) {
            throw new RuntimeException("Debe existir al menos un administrador");
        }
    }
}
