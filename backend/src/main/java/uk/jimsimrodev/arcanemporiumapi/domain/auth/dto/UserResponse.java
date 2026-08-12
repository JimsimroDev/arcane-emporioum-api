package uk.jimsimrodev.arcanemporiumapi.domain.auth.dto;

import uk.jimsimrodev.arcanemporiumapi.domain.auth.model.Erole;

public record UserResponse(Long id, String email, Erole role) {
}
