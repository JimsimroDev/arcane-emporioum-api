package uk.jimsimrodev.arcanemporiumapi.domain.favorites.controller;

import java.util.Locale;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import uk.jimsimrodev.arcanemporiumapi.domain.artifact.dto.ArtifactResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.favorites.service.IFavoriteService;

@RestController
@RequestMapping("/api/v1/favorites")
public class FavoriteController {

    private final IFavoriteService favoriteService;

    @Autowired
    public FavoriteController(IFavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @PostMapping("/{artifactId}")
    public ResponseEntity<ArtifactResponse> addFavorite(@PathVariable Long artifactId, Authentication authentication,
            Locale locale,
            @RequestParam(required = false) String currency) {
        return ResponseEntity.ok()
                .body(favoriteService.addFavorite(authentication.getName(), artifactId, locale, currency));
    }

    @GetMapping()
    public ResponseEntity<Page<ArtifactResponse>> getFavorite(
            @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pagination,
            Authentication authentication,
            Locale locale, @RequestParam(required = false) String currency) {

        return ResponseEntity.ok()
                .body(favoriteService.getFavorites(pagination, authentication.getName(), locale, currency));

    }

    @DeleteMapping("/{artifactId}")
    public ResponseEntity<?> removeFavorite(@PathVariable Long artifactId, Authentication authentication) {
        favoriteService.removeFavorite(authentication.getName(), artifactId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

}
