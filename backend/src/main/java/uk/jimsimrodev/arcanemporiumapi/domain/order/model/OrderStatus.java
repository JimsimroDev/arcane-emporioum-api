package uk.jimsimrodev.arcanemporiumapi.domain.order.model;

public enum OrderStatus {
    PREPARING("en preparacion"),
    IN_TRANSIT("en camino"),
    DELIVERED("entregado");

    private String status;

    OrderStatus(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public static OrderStatus fromStatus(String status) {
        for (OrderStatus s : OrderStatus.values()) {
            if (s.getStatus().equalsIgnoreCase(status)) return s;
        }
        return null;
    }
}
