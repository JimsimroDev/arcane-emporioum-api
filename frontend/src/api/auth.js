import { apiFetch } from './client.js'

export function login(email, password) {
  return apiFetch('/api/v1/login', { method: 'POST', body: { email, password } })
}

export function logout() {
  return apiFetch('/api/v1/logout', { method: 'POST' })
}

export function requestPasswordReset(email) {
  return apiFetch('/api/v1/forgot-password', { method: 'POST', body: { email } })
}

export function resetPassword(token, newPassword) {
  return apiFetch('/api/v1/reset-password', { method: 'POST', body: { token, newPassword } })
}

export function changePassword(currentPassword, newPassword) {
  return apiFetch('/api/v1/change-password', { method: 'POST', body: { currentPassword, newPassword } })
}

export function getAdminStatus() {
  return apiFetch('/api/v1/admin')
}

export function getUserStatus() {
  return apiFetch('/api/v1/user')
}

export function register(email, password) {
  return apiFetch('/api/v1/register', { method: 'POST', body: { email, password } })
}

export function getUsers(page = 0, size) {
  const params = new URLSearchParams({ page: String(page) })
  if (size) params.set('size', String(size))
  return apiFetch(`/api/v1/users?${params.toString()}`)
}

export function updateRole(id, role) {
  return apiFetch(`/api/v1/users/${id}/role`, { method: 'PATCH', body: { role } })
}

export function deleteUser(id) {
  return apiFetch(`/api/v1/users/${id}`, { method: 'DELETE' })
}
