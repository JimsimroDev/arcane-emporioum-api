import { apiFetch } from './client.js'

export function createOrder({ artifactId, quantity, lang }) {
  const params = new URLSearchParams({ lang })
  return apiFetch(`/api/v1/orders?${params.toString()}`, {
    method: 'POST',
    body: { artifactId, quantity },
  })
}
