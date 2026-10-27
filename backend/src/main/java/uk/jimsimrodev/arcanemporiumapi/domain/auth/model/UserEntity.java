package uk.jimsimrodev.arcanemporiumapi.domain.auth.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;


@Table(name = "users")
public class UserEntity {
    @Id
    private Long id;
    private String email;
    private String password;
    private String resetToken;
    private LocalDateTime tokenResetPasswordExpiresAt;
    private Erole role;
    private Boolean active;

    public UserEntity() {
    }

    public Long getId() {
        return this.id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return this.email;
    }

    public void setEmail(String correo) {
        this.email = correo;
    }

    public String getPassword() {
        return this.password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getResetToken() {
        return this.resetToken;
    }

    public void setResetToken(String resetToken) {
        this.resetToken = resetToken;
    }

    public LocalDateTime getTokenResetPasswordExpiresAt() {
        return this.tokenResetPasswordExpiresAt;
    }

    public void setTokenResetPasswordExpiresAt(LocalDateTime setTokenResetPasswordExpiresAt) {
        this.tokenResetPasswordExpiresAt = setTokenResetPasswordExpiresAt;
    }

    public Erole getRole() {
        return this.role;
    }

    public void setRole(Erole role) {
        this.role = role;
    }

    public Boolean getActive() {
        return this.active;
    }

    public void setActive(Boolean activated) {
        this.active = activated;
    }
}
