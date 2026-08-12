package uk.jimsimrodev.arcanemporiumapi.domain.artifact.services;

import java.util.Locale;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import uk.jimsimrodev.arcanemporiumapi.domain.artifact.dto.ArtifactResponse;
import uk.jimsimrodev.arcanemporiumapi.domain.artifact.model.ECategory;

public interface IArtifactService {

  Page<ArtifactResponse> getAllArtifact(Pageable pagination, Locale locale, String currency);

  Optional<ArtifactResponse> getArtifact(Long id, Locale locale, String currency);

  Page<ArtifactResponse> getArtifactCategorList(Pageable pagination, ECategory category, Locale locale,
      String currency);

  Page<ArtifactResponse> searchByKeyword(Pageable pagination, String keyword, Locale locale, String currency);

}
