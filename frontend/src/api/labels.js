import { apiFetch } from './client.js'

export function fetchLabels(lang) {
  const params = new URLSearchParams({ lang })
  return apiFetch(`/api/v1/labels?${params.toString()}`)
}
