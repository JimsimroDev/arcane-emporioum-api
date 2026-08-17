import { apiFetch } from './client.js'

export function createOrder({ artifactId, quantity, lang }) {
  const params = new URLSearchParams({ lang })
  return apiFetch(`/api/v1/orders?${params.toString()}`, {
    method: 'POST',
    body: { artifactId, quantity },
  })
}

export function getMyOrders({ page = 0, size, lang }) {
  const params = new URLSearchParams({ lang, page: String(page) })

  if (size) params.set('size', String(size))

  return apiFetch(`/api/v1/orders?${params.toString()}`)
}

export function cancelOrder(orderId, lang) {
  const params = new URLSearchParams({ lang })
  return apiFetch(`/api/v1/orders/${orderId}/cancel?${params.toString()}`, {
    method: 'POST',
  })
}

export function updateOrderStatus(orderId, newStatus, lang) {
  const params = new URLSearchParams({ lang })
  return apiFetch(`/api/v1/orders/${orderId}?${params.toString()}`, {
    method: 'PATCH',
    body: { newStatus },
  })
}
