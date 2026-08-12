import { apiFetch } from './client.js'

export function fetchArtifact(id, lang) {
  const params = new URLSearchParams({ lang })
  return apiFetch(`/api/v1/artifacts/${id}?${params.toString()}`)
}

export function fetchArtifacts(lang, page = 0, size, sort) {
  const params = new URLSearchParams({ lang, page: String(page) })
  if (size) params.set('size', String(size))
  if (sort) params.set('sort', sort)
  return apiFetch(`/api/v1/artifacts?${params.toString()}`)
}

export function fetchArtifactsByCategory(category, lang, page = 0, size, sort) {
  const params = new URLSearchParams({ lang, page: String(page) })
  if (size) params.set('size', String(size))
  if (sort) params.set('sort', sort)
  return apiFetch(`/api/v1/artifacts/category/${category}?${params.toString()}`)
}

export function searchArtifactsByKeyword(keyword, lang, page = 0, size, sort) {
  const params = new URLSearchParams({ lang, page: String(page), q: keyword })
  if (size) params.set('size', String(size))
  if (sort) params.set('sort', sort)
  return apiFetch(`/api/v1/artifacts/search?${params.toString()}`)
}
