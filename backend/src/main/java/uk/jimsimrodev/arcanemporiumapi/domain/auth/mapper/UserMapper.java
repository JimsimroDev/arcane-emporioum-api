package uk.jimsimrodev.arcanemporiumapi.domain.auth.mapper;

import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.UserRequest;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.UserResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.model.Erole;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.model.UserEntity;

public final class UserMapper {
    private UserMapper() {
    }

    // Entidad ->DTO  UserResponse
    public static UserResponse toResponse(UserEntity user) {

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getRole());
    }

    // DTO -> Entidad
    public static UserEntity toEntity(UserRequest request, String encodedPassword,Erole role) {

        UserEntity user = new UserEntity();
        user.setEmail(request.email());
        user.setPassword(encodedPassword);
        user.setRole(role);
        user.setActive(true);
        return user;
    }
}
