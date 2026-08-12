package uk.jimsimrodev.arcanemporiumapi.domain.auth.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.dto.*;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.services.IUserService;

@RestController
@RequestMapping("/api/v1")
public class LoginController {

  @Autowired
  private IUserService userService;

  @PostMapping("/register")
  public ResponseEntity<UserResponse> register(@RequestBody UserRequest userRequest) {

    UserResponse response = userService.register(userRequest);

    System.out.println("data recibida " + userRequest);

    return new ResponseEntity<>(response, HttpStatus.CREATED);
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody UserRequest userRequest,
      HttpServletResponse response,
      HttpServletRequest request) {

    System.out.println("datos recibidos " + userRequest);

    return new ResponseEntity<>(userService.login(userRequest, request, response), HttpStatus.OK);

  }

  @PostMapping("/forgot-password")
  public ResponseEntity<?> forgotPassword(@RequestBody RequestPasswordReset requestPasswordReset) {
    userService.forgotPassword(requestPasswordReset);
    return new ResponseEntity<>(HttpStatus.OK);
  }

  @PostMapping("/reset-password")
  public ResponseEntity<?> resetPassword(@RequestBody ResetPassword resetPassword) {
    userService.resetPassword(resetPassword.newPassword(), resetPassword.token());
    return new ResponseEntity<>("Su contraseña ha sido acutlizada corectamente", HttpStatus.OK);
  }

  @GetMapping("/admin")
  @PreAuthorize("hasRole('ADMIN')")
  public String admin() {
    return "Acceso consedido como rol de administrador";
  }

  @GetMapping("/user")
  @PreAuthorize("hasAnyRole('USER','ADMIN')")
  public String user() {
    return "Acceso concedido como rol de usuario";
  }

  @GetMapping("/public")
  public String publico() {
    return "Acceso concedido para todo publico";
  }

  @PostMapping("/change-password")
  public ResponseEntity<?> changePassword(@RequestBody ChangePassword changePassword, Authentication authentication) {
    userService.changePassword(authentication.getName(),changePassword.currentPassword(), changePassword.newPassword());
    return new ResponseEntity<>(HttpStatus.OK);
  }
}
