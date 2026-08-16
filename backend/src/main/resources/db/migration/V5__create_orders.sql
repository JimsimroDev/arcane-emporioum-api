CREATE TABLE orders
(
    id         BIGSERIAL PRIMARY KEY,
    id_user    BIGINT       NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    status     VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_orders_users
        FOREIGN KEY (id_user) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_orders_user ON orders (id_user);

CREATE TABLE orders_artifacts
(
    id          BIGSERIAL PRIMARY KEY,
    id_order    BIGINT         NOT NULL,
    id_artifact BIGINT         NOT NULL,
    quantity    BIGINT         NOT NULL,
    unit_price  NUMERIC(12, 2) NOT NULL,

    CONSTRAINT uq_order_artifact UNIQUE (id_order, id_artifact),

    CONSTRAINT fk_order_artifacts_order
        FOREIGN KEY (id_order) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_artifacts_artifacts
        FOREIGN KEY (id_artifact) REFERENCES artifacts (id) ON DELETE RESTRICT,
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_unit_price_positive CHECK (unit_price >= 0)
);