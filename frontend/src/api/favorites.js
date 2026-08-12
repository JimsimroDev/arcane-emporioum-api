import { apiFetch } from './client.js'

export function fetchFavorites(lang, page = 0, size) {
  const params = new URLSearchParams({ lang, page: String(page) })
  if (size) params.set('size', String(size))
  return apiFetch(`/api/v1/favorites?${params.toString()}`)
}

export function addFavorite(id, lang) {
  const params = new URLSearchParams({ lang })
  return apiFetch(`/api/v1/favorites/${id}?${params.toString()}`, { method: 'POST' })
}

export function removeFavorite(id) {
  return apiFetch(`/api/v1/favorites/${id}`, { method: 'DELETE' })
}
