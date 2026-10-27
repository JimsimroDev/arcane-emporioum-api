package uk.jimsimrodev.arcanemporiumapi.domain.favorites.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.dto.ArtifactResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.favorites.service.IFavoriteService;

import java.util.Locale;

@RestController
@RequestMapping("/api/v1/favorites")
public class FavoriteController {

    private final IFavoriteService favoriteService;

    @Autowired
    public FavoriteController(IFavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @PostMapping("/{artifactId}")
    public Mono<ArtifactResponse> addFavorite(@PathVariable Long artifactId, Authentication authentication,
                                              Locale locale,
                                              @RequestParam(required = false) String currency) {

        return favoriteService.addFavorite(authentication.getName(), artifactId, locale, currency);
    }

    @GetMapping()
    public Flux<ArtifactResponse> getFavorite(
            @RequestParam(defaultValue  = "0")int page,
            @RequestParam(defaultValue = "12")int size,
            Authentication authentication,
            Locale locale, @RequestParam(required = false) String currency) {

        return favoriteService.getFavorites(PageRequest.of(page,size,Sort.by(Sort.Direction.ASC,"createdAt")),
                authentication.getName(), locale, currency);

    }

    @DeleteMapping("/{artifactId}")
    public Mono<?> removeFavorite(@PathVariable Long artifactId, Authentication authentication) {

        return favoriteService.removeFavorite(authentication.getName(), artifactId);
    }

}
