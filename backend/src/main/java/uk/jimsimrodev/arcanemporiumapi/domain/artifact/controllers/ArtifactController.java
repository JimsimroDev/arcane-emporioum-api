package uk.jimsimrodev.arcanemporiumapi.domain.artifact.controllers;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import uk.jimsimrodev.arcanemporiumapi.domain.artifact.dto.ArtifactResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.ECategory;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.services.ArtifactService;
import uk.jimsimrodev.arcanemporiumapi.infra.i18n.MessageService;

@RestController
@RequestMapping("/api/v1/artifacts")
public class ArtifactController {

    private static final Logger log = LoggerFactory.getLogger(ArtifactController.class);

    private ArtifactService artifactService;
    private MessageService messageService;

    @Autowired
    public ArtifactController(ArtifactService artifactService, MessageService messageService) {
        this.artifactService = artifactService;
        this.messageService = messageService;
    }

    @GetMapping()
    public ResponseEntity<Page<ArtifactResponse>> getAllArtifact(
            @PageableDefault(size = 12, sort = "id", direction = Sort.Direction.ASC) Pageable pagination, Locale locale,
            @RequestParam(required = false) String currency) {

        return ResponseEntity.ok(artifactService.getAllArtifact(pagination, locale, currency));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getArtifact(@PathVariable Long id, Locale locale,
            @RequestParam(required = false) String currency) {

        log.info("Resolved locale: {}", locale);

        Optional<ArtifactResponse> artifact = artifactService.getArtifact(id, locale, currency);

        if (artifact.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", messageService.label("artifact.notfound", locale)));
        }

        log.info("Artifact returned: {}", artifact.get());

        return ResponseEntity.ok(artifact.get());
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<Page<ArtifactResponse>> getArtifactCategory(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pagination,
            @PathVariable String category,
            Locale locale,
            @RequestParam(required = false) String currency) {

        ECategory parsed = ECategory.fromRole(category);

        return ResponseEntity.ok(artifactService.getArtifactCategorList(pagination, parsed, locale, currency));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ArtifactResponse>> searchArtifacts(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pagination,
            @RequestParam(name = "q") String keyword,
            Locale locale, @RequestParam(required = false) String currency) {

        return ResponseEntity.ok(artifactService.searchByKeyword(pagination, keyword, locale, currency));
    }

}
