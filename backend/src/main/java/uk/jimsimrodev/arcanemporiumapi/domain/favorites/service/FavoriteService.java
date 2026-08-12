package uk.jimsimrodev.arcanemporiumapi.domain.favorites.service;

import java.util.Locale;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import uk.jimsimrodev.arcanemporiumapi.domain.artifact.dto.ArtifactResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.Artifact;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.repositories.IArtifactRepository;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.services.ArtifactService;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.Repositories.IUserRepository;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.model.UserEntity;
import uk.jimsimrodev.arcanemporiumapi.domain.favorites.model.Favorite;
import uk.jimsimrodev.arcanemporiumapi.domain.favorites.repositories.IFavoriteRepository;

@Service
public class FavoriteService implements IFavoriteService {

    private final IFavoriteRepository favoriteRepository;
    private final IUserRepository userRepository;
    private final IArtifactRepository artifactRepository;
    private final ArtifactService artifactService;

    public FavoriteService(IFavoriteRepository favoriteRepository, IUserRepository userRepository,
            IArtifactRepository artifactRepository, ArtifactService artifactService) {
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
        this.artifactRepository = artifactRepository;
        this.artifactService = artifactService;
    }

    @Override
    public ArtifactResponse addFavorite(String userEmail, Long artifactId, Locale locale, String currency) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        Artifact artifact = artifactRepository.findWithTranslationsById(artifactId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Artefacto no encontrado"));

        if (!favoriteRepository.existsByUser_IdAndArtifact_Id(user.getId(), artifactId)) {
            Favorite favorite = new Favorite();
            favorite.setUser(user);
            favorite.setArtifact(artifact);
            favoriteRepository.save(favorite);
        }

        return artifactService.toResponse(artifact, locale, currency);

    }

    @Override
    public Page<ArtifactResponse> getFavorites(Pageable pagination, String userEmail, Locale locale, String currency) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        return favoriteRepository.findAllByUser_IdOrderByCreatedAtDesc(pagination, user.getId())
                .map(favorite -> artifactService.toResponse(favorite.getArtifact(), locale, currency));

    }

    @Override
    @Transactional
    public void removeFavorite(String userEmail, Long artifactId) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        favoriteRepository.deleteByUser_IdAndArtifact_Id(user.getId(), artifactId);

    }

}
