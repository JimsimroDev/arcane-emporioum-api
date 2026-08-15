package uk.jimsimrodev.arcanemporiumapi.domain.order.model;

import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Table(name = "orders")
public class Orders {
    private Long id;
    private LocalDateTime createdAt;
    private OrderStatus status;

    public Long getId() {
        return this.id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getCreatedAt() {
        return this.createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OrderStatus getStatus() {
        return this.status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }
}
