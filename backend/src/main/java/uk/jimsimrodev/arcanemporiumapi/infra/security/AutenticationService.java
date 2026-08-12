
package uk.jimsimrodev.arcanemporiumapi.infra.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import uk.jimsimrodev.arcanemporiumapi.domain.auth.Repositories.IUserRepository;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.model.UserEntity;

@Service
public class AutenticationService implements UserDetailsService {

  private IUserRepository userRepository;

  @Autowired
  public AutenticationService(IUserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @Override
  public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
    UserEntity user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("Usuarion no encontrado" + email));

    return User.withUsername(user.getEmail())
        .password(user.getPassword())
        .roles(user.getRole().name())
        .build();
  }
}
