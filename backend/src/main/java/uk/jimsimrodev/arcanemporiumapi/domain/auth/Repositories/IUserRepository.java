package uk.jimsimrodev.arcanemporiumapi.domain.auth.Repositories;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uk.jimsimrodev.arcanemporiumapi.domain.auth.model.Erole;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.model.UserEntity;

@Repository
public interface IUserRepository extends JpaRepository<UserEntity, Long> {

    Page<UserEntity> findAllByActiveTrue(Pageable pagination);

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByResetToken(String token);

    int countByRole(Erole role);
}
