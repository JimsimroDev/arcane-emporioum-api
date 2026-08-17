package uk.jimsimrodev.arcanemporiumapi.domain.artifact.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.dto.ArtifactResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.ECategory;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.services.ArtifactService;

import java.util.Locale;

@RestController
@RequestMapping("/api/v1/artifacts")
public class ArtifactController {

    private static final Logger log = LoggerFactory.getLogger(ArtifactController.class);

    private final ArtifactService artifactService;
    // private final MessageService messageService;

    @Autowired
    public ArtifactController(ArtifactService artifactService) {
        this.artifactService = artifactService;
    }

    @GetMapping()
    public Flux<ArtifactResponse> getAllArtifact(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            Locale locale,
            @RequestParam(required = false) String currency) {

        return artifactService.getAllArtifact(PageRequest.of(page, size), locale, currency);
    }

    @GetMapping("/{id}")
    public Mono<ArtifactResponse> getArtifact(@PathVariable Long id, Locale locale,
                                              @RequestParam(required = false) String currency) {

        return artifactService.getArtifact(id, locale, currency);
    }

    @GetMapping("/category/{category}")
    public Flux<ArtifactResponse> getArtifactCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Locale locale,
            @RequestParam(required = false) String currency) {

        ECategory parsed = ECategory.fromRole(category);

        return artifactService.getArtifactCategorList(PageRequest.of(page, size), parsed, locale, currency);
    }

    @GetMapping("/search")
    public Flux<ArtifactResponse> searchArtifacts(
            @RequestParam(name = "q") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Locale locale,
            @RequestParam(required = false) String currency) {

        return artifactService.searchByKeyword(PageRequest.of(page, size), keyword, locale, currency);
    }
}
