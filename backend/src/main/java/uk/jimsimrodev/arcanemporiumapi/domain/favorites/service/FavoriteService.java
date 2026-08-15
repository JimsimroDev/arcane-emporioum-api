package uk.jimsimrodev.arcanemporiumapi.domain.favorites.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.dto.ArtifactResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.services.ArtifactService;
import uk.jimsimrodev.arcanemporiumapi.domain.auth.Repositories.IUserRepository;
import uk.jimsimrodev.arcanemporiumapi.domain.favorites.mapper.FavoriteMapper;
import uk.jimsimrodev.arcanemporiumapi.domain.favorites.repositories.IFavoriteRepository;

import java.util.Locale;

@Service
public class FavoriteService implements IFavoriteService {

    private final IFavoriteRepository favoriteRepository;
    private final IUserRepository userRepository;
    private final ArtifactService artifactService;

    @Autowired
    public FavoriteService(IFavoriteRepository favoriteRepository, IUserRepository userRepository,
                           ArtifactService artifactService) {
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
        this.artifactService = artifactService;
    }

    @Override
    public Mono<ArtifactResponse> addFavorite(String userEmail, Long artifactId, Locale locale, String currency) {

        return userRepository.findByEmail(userEmail)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .flatMap(user -> favoriteRepository.existsByUserIdAndArtifactId(user.getId(), artifactId)
                        .flatMap(exists -> {
                            if (exists) {
                                return Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "El artefacto ya es favorito"));
                            }
                            return favoriteRepository.save(FavoriteMapper.toEntity(user.getId(), artifactId))
                                    .flatMap(f -> artifactService.getArtifact(artifactId, locale, currency));
                        }));
    }

    @Override
    public Flux<ArtifactResponse> getFavorites(Pageable pageable, String userEmail, Locale locale, String currency) {

        return userRepository.findByEmail(userEmail)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"))).
                flatMapMany(user -> favoriteRepository.findAllByUserId(user.getId(), pageable))
                .flatMap(favorite -> artifactService.getArtifact(favorite.getArtifactId(), locale, currency));

    }

    @Override
    @Transactional
    public Mono<Void> removeFavorite(String userEmail, Long artifactId) {
        
        return userRepository.findByEmail(userEmail)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .flatMap(user -> favoriteRepository.deleteByUserIdAndArtifactId(user.getId(), artifactId));

    }
}
