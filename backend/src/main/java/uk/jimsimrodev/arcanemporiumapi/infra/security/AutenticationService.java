package uk.jimsimrodev.arcanemporiumapi.infra.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.Repositories.IUserRepository;

@Service
public class AutenticationService implements ReactiveUserDetailsService {

    private IUserRepository userRepository;

    @Autowired
    public AutenticationService(IUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public Mono<UserDetails> findByUsername(String email) {
        return userRepository.findByEmail(email)
                .switchIfEmpty(Mono.error(new UsernameNotFoundException("Usuario no encontrado: " + email)))
                .map(user -> User.withUsername(user.getEmail())
                        .password(user.getPassword())
                        .roles(user.getRole().name())
                        .build());
    }
}
