import { useCallback, useEffect, useState } from 'react'
import { addFavorite, fetchFavorites, removeFavorite } from '../api/favorites.js'
import { useAuth } from './useAuth.js'

// La API WebFlux devuelve un array JSON plano: no puede anunciar cuántos
// elementos sirve por página. La primera petición se hace SIN el parámetro
// `size` para que decida el default del backend (PageableDefault), y aprendemos
// el tamaño efectivo a partir de la longitud de esa primera respuesta.

export function useFavorites(lang) {
  const { isLoggedIn } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pendingId, setPendingId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [page, setPage] = useState(0)
  // Tamaño de página efectivo, aprendido de la primera respuesta del backend.
  const [pageSize, setPageSize] = useState(null)

  useEffect(() => {
    let cancelled = false

    if (!isLoggedIn) {
      setFavorites([])
      setPage(0)
      setLoading(false)
      setError(null)
      return () => {
        cancelled = true
      }
    }

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchFavorites(lang, page, pageSize)
        if (!cancelled) {
          setFavorites(data)
          setPageSize(data.length > 0 ? data.length : null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [lang, isLoggedIn, reloadKey, page])

  const retry = useCallback(() => setReloadKey((key) => key + 1), [])

  const isFavorite = useCallback(
    (artifactId) => favorites.some((artifact) => artifact.id === artifactId),
    [favorites],
  )

  const toggle = useCallback(
    async (artifactId) => {
      setPendingId(artifactId)
      try {
        if (isFavorite(artifactId)) {
          await removeFavorite(artifactId)
          setFavorites((current) => current.filter((artifact) => artifact.id !== artifactId))
        } else {
          const artifact = await addFavorite(artifactId, lang)
          if (artifact) {
            setFavorites((current) =>
              current.some((item) => item.id === artifact.id)
                ? current
                : [artifact, ...current],
            )
          }
        }
      } catch (err) {
        throw err
      } finally {
        setPendingId(null)
      }
    },
    [isFavorite, lang],
  )

  return { favorites, loading, error, pendingId, isFavorite, toggle, retry, page, setPage }
}
