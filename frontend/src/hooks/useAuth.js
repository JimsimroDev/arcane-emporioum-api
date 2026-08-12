import { useCallback, useEffect, useState } from 'react'
import { logout as logoutRequest } from '../api/auth.js'
import { AUTH_STORAGE_KEY } from '../lib/constants.js'

function readStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

let currentUser = readStoredUser()
const listeners = new Set()

function emit(nextUser) {
  currentUser = nextUser
  listeners.forEach((listener) => listener(nextUser))
}

export function useAuth() {
  const [user, setUser] = useState(currentUser)

  useEffect(() => {
    listeners.add(setUser)
    return () => listeners.delete(setUser)
  }, [])

  const saveUser = useCallback((nextUser) => {
    if (nextUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
    emit(nextUser)
  }, [])

  const clearSession = useCallback(() => saveUser(null), [saveUser])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // Session may already be invalid server-side; local state still clears.
    }
    saveUser(null)
  }, [saveUser])

  const isLoggedIn = user !== null
  const isAdmin = user?.role === 'ADMIN'

  return { user, isLoggedIn, isAdmin, saveUser, clearSession, logout }
}
