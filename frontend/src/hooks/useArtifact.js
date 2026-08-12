import { useCallback, useEffect, useState } from 'react'
import { fetchArtifact } from '../api/artifacts.js'

export function useArtifact(id, lang) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await fetchArtifact(id, lang))
    } catch (err) {
      setError(err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [id, lang])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, retry: load }
}
