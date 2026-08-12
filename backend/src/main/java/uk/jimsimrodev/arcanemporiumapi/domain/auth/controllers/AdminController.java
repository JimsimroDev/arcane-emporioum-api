package uk.jimsimrodev.arcanemporiumapi.domain.auth.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Flux;
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
    public Flux<Page<UserResponse>> getAllUsers(@PageableDefault(size = 6) Pageable pagination) {
        return ResponseEntity.ok(userService.getAllUsers(pagination));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<UserResponse> updateRole(@PathVariable Long id, @RequestBody UpdateRole updateRole) {
        return ResponseEntity.ok(userService.updateRole(id, updateRole.role()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
