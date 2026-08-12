package uk.jimsimrodev.arcanemporiumapi.domain.auth.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import reactor.core.publisher.Flux;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.RequestPasswordReset;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.UserRequest;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.UserResponse;

public interface IUserService {

    UserResponse register(UserRequest userRequest);

    UserResponse login(UserRequest userRequest, HttpServletRequest request, HttpServletResponse response);

    Flux<Page<UserResponse>> getAllUsers(Pageable pagination);

    UserResponse updateRole(Long id, String newRole);

    public void forgotPassword(RequestPasswordReset requestPasswordReset);

    public void resetPassword(String newPassword, String token);

    public void changePassword(String email, String currentPassword, String newPassword);

    public void deleteUser(Long id);

}
