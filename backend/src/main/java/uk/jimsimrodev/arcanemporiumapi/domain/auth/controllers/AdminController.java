package uk.jimsimrodev.arcanemporiumapi.domain.auth.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.UpdateRole;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.UserResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.services.UserService;

@RestController
@RequestMapping("/api/v1/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;

    @Autowired
    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping()
    public Mono<PageImpl<UserResponse>> getAllUsers(@RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "20") int size) {

        return userService.getAllUsers(PageRequest.of(page, size));
    }

    @PatchMapping("/{id}/role")
    public Mono<UserResponse> updateRole(@PathVariable Long id, @RequestBody UpdateRole updateRole) {

        return userService.updateRole(id, updateRole.role());
    }

    @DeleteMapping("/{id}")
    public Mono<?> deleteUser(@PathVariable Long id) {

        return userService.deleteUser(id);
    }
}
