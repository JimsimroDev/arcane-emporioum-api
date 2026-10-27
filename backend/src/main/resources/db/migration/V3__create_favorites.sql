CREATE TABLE favorites
(
    id          BIGSERIAL PRIMARY KEY,
    id_user     BIGINT       NOT NULL,
    id_artifact BIGINT       NOT NULL,
    created_at  TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_favorite_user
        FOREIGN KEY (id_user) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_favorite_artifact
        FOREIGN KEY (id_artifact) REFERENCES artifacts (id) ON DELETE CASCADE,
    CONSTRAINT uq_favorite_user_artifact UNIQUE (id_user, id_artifact)
);