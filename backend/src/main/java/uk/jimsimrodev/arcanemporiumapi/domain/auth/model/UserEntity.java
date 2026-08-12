package uk.jimsimrodev.arcanemporiumapi.domain.auth.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String email;
    private String password;
    private String resetToken;
    private LocalDateTime tokenResetPasswordExpiresAt;
    @Enumerated(EnumType.STRING)
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
        return resetToken;
    }

    public void setResetToken(String resetToken) {
        this.resetToken = resetToken;
    }

    public LocalDateTime getTokenResetPasswordExpiresAt() {
        return tokenResetPasswordExpiresAt;
    }

    public void setTokenResetPasswordExpiresAt(LocalDateTime setTokenResetPasswordExpiresAt) {
        this.tokenResetPasswordExpiresAt = setTokenResetPasswordExpiresAt;
    }

    public Erole getRole() {
        return this.role;
    }

    public void setRole(Erole rol) {
        this.role = rol;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean activated) {
        this.active = activated;
    }

}
