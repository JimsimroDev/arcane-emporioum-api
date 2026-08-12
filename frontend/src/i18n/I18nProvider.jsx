import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchLabels } from '../api/labels.js'

const STORAGE_KEY = 'idioma'

const I18nContext = createContext(null)

function getInitialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'es' || stored === 'en' || stored === 'pt') {
      return stored
    }
  } catch {
    // localStorage unavailable (private mode, etc.)
  }
  return 'es'
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang)
  const [labels, setLabels] = useState({})
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    fetchLabels(lang)
      .then((data) => {
        if (cancelled) return
        setLabels(data ?? {})
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [lang])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore storage failures
    }
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback((key) => labels[key] ?? key, [labels])

  const value = useMemo(() => ({ lang, setLang, t, labelsStatus: status }), [lang, t, status])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
