CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255),
    token_reset_password_expires_at TIMESTAMP(6),
    role VARCHAR(50) NOT NULL,
    active BOOLEAN NOT NULL
);

CREATE TABLE artifacts (
    id             BIGSERIAL PRIMARY KEY,
    title          VARCHAR(255) NOT NULL,
    description    VARCHAR(255) NOT NULL,
    price          NUMERIC(12,2) NOT NULL,
    required_level INTEGER NOT NULL,
    in_stock       BOOLEAN NOT NULL,
    category       VARCHAR(20) NOT NULL,
    rarity         VARCHAR(20) NOT NULL,
    image_url      VARCHAR(500)
);

CREATE TABLE artifact_translations (
    id          BIGSERIAL PRIMARY KEY,
    id_artifact BIGINT NOT NULL,
    locale      VARCHAR(5) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    CONSTRAINT fk_translation_artifact
        FOREIGN KEY (id_artifact) REFERENCES artifacts (id) ON DELETE CASCADE,
    CONSTRAINT uq_artifact_locale UNIQUE (id_artifact, locale)
);

INSERT INTO users (active,email,password,role) VALUES (true,'correo@prueba.com','$2a$12$AJR3kQDvejl1rrDhLjVvp.vqUu9br4O4kz8su7nCpJfpqiNb8cJfW','ADMIN')
