import { useEffect, useState } from 'react'
import { Gem, Loader2, PackageOpen, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchArtifact, fetchArtifacts, fetchArtifactsByCategory, searchArtifactsByKeyword } from '../api/artifacts.js'
import { ArtifactCard } from '../components/artifact/ArtifactCard.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { useI18n } from '../i18n/I18nProvider.jsx'
import { useFavorites } from '../hooks/useFavorites.js'

const CATEGORIES = [
  { value: 'weapon' },
  { value: 'scroll' },
  { value: 'relic' },
  { value: 'armor' },
  { value: 'potion' },
]

// La API WebFlux devuelve un array JSON plano: no puede anunciar cuántos
// elementos sirve por página. Por eso el frontend no fija un tamaño de página.
// La primera petición se hace SIN el parámetro `size`, el backend aplica su
// default, y aprendemos el tamaño efectivo a partir de la longitud de esa
// primera respuesta.

// Estas etiquetas normalmente vienen del backend (/api/v1/labels). Hasta que
// catalog.loadMore exista allí, se usa una traducción local como respaldo.
const LOAD_MORE_LABELS = { es: 'Cargar más', en: 'Load more', pt: 'Carregar mais' }

function SkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <div className="p-3 pb-0">
        <div className="aspect-[16/10] animate-pulse rounded-xl bg-arcane-800" />
      </div>
      <div className="flex flex-col gap-3 p-5">
        <div className="flex gap-2">
          <div className="h-6 w-20 animate-pulse rounded-full bg-arcane-800" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-arcane-800" />
        </div>
        <div className="h-5 w-3/4 animate-pulse rounded bg-arcane-800" />
        <div className="h-4 w-full animate-pulse rounded bg-arcane-800" />
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-arcane-800" />
      </div>
    </Card>
  )
}

function LoadMoreButton({ label, loading, error, onClick }) {
  return (
    <div className="mt-10 flex flex-col items-center gap-2">
      <Button variant="secondary" onClick={onClick} disabled={loading}>
        {loading && <Loader2 size={16} className="animate-spin" />}
        {label}
      </Button>
      {error && <p className="text-xs text-arcane-400">{error.message}</p>}
    </div>
  )
}

export function ArtifactCatalogPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { favorites, isFavorite, pendingId, toggle } = useFavorites(lang)

  const [artifacts, setArtifacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  // Tamaño de página efectivo, aprendido de la primera respuesta del backend.
  const [pageSize, setPageSize] = useState(null)
  const [page, setPage] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [category, setCategory] = useState(null)

  const loadMoreLabel = t('catalog.loadMore')
  const resolvedLoadMoreLabel =
    loadMoreLabel === 'catalog.loadMore' ? LOAD_MORE_LABELS[lang] ?? 'Load more' : loadMoreLabel

  // Carga inicial / recarga (cambió idioma, categoría o se reintentó):
  // reemplaza toda la lista con la primera página.
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        // La primera petición va SIN `size`: decide el default del backend.
        const data = category
          ? await fetchArtifactsByCategory(category, lang, 0)
          : await fetchArtifacts(lang, 0)
        if (!cancelled) {
          setArtifacts(data)
          setPage(0)
          // El tamaño de página efectivo del servidor = longitud de la primera página.
          const effectiveSize = data.length
          setPageSize(effectiveSize > 0 ? effectiveSize : null)
          // No sabemos si la página 0 estaba "llena": cualquier elemento significa "probar de nuevo".
          setHasMore(data.length > 0)
        }
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [lang, category, reloadKey])

  async function loadMore() {
    setLoadingMore(true)
    setLoadMoreError(null)
    try {
      const next = page + 1
      const data = category
        ? await fetchArtifactsByCategory(category, lang, next, pageSize)
        : await fetchArtifacts(lang, next, pageSize)
      setArtifacts((current) => [...current, ...data])
      setPage(next)
      // Una página más corta que el tamaño aprendido significa que llegamos al final.
      setHasMore(pageSize !== null && data.length === pageSize)
    } catch (err) {
      setLoadMoreError(err)
    } finally {
      setLoadingMore(false)
    }
  }

  const [search, setSearch] = useState('')
  const [searchStatus, setSearchStatus] = useState('idle')
  const [searchResult, setSearchResult] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [searchPage, setSearchPage] = useState(0)
  const [searchPageSize, setSearchPageSize] = useState(null)
  const [hasMoreSearch, setHasMoreSearch] = useState(false)
  const [searchLoadingMore, setSearchLoadingMore] = useState(false)
  const [searchLoadMoreError, setSearchLoadMoreError] = useState(null)

  function handleCategoryChange(nextCategory) {
    setCategory(nextCategory)
    setPage(0)
    setSearchStatus('idle')
    setSearchResult(null)
    setSearchResults([])
  }

  // Cualquier cambio en la búsqueda inicia una búsqueda nueva desde la página 0.
  useEffect(() => {
    const q = search.trim()
    if (!q) {
      setSearchStatus('idle')
      setSearchResult(null)
      setSearchResults([])
      setHasMoreSearch(false)
      setSearchPageSize(null)
      return
    }

    let cancelled = false
    setSearchStatus('loading')

    if (/^\d+$/.test(q)) {
      fetchArtifact(Number(q), lang)
        .then((artifact) => {
          if (!cancelled) {
            setSearchResult(artifact)
            setSearchResults([])
            setSearchStatus('found')
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSearchResult(null)
            setSearchResults([])
            setSearchStatus('notfound')
          }
        })
      return () => {
        cancelled = true
      }
    }

    // La primera búsqueda va SIN `size`: decide el default del backend.
    searchArtifactsByKeyword(q, lang, 0)
      .then((data) => {
        if (!cancelled) {
          setSearchResults(data)
          setSearchPage(0)
          const effectiveSize = data.length
          setSearchPageSize(effectiveSize > 0 ? effectiveSize : null)
          setHasMoreSearch(data.length > 0)
          setSearchStatus(data.length > 0 ? 'found' : 'notfound')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSearchResults([])
          setSearchStatus('notfound')
        }
      })
    return () => {
      cancelled = true
    }
  }, [search, lang])

  async function loadMoreSearch() {
    const q = search.trim()
    const next = searchPage + 1
    setSearchLoadingMore(true)
    setSearchLoadMoreError(null)
    try {
      const data = await searchArtifactsByKeyword(q, lang, next, searchPageSize)
      setSearchResults((current) => [...current, ...data])
      setSearchPage(next)
      // Una página más corta que el tamaño aprendido significa que llegamos al final.
      setHasMoreSearch(searchPageSize !== null && data.length === searchPageSize)
    } catch (err) {
      setSearchLoadMoreError(err)
    } finally {
      setSearchLoadingMore(false)
    }
  }

  return (
    <>
      <section className="border-b border-arcane-700/40 bg-[radial-gradient(ellipse_at_top,rgba(147,51,234,0.18),transparent_60%)]">
        <div className="mx-auto max-w-6xl px-4 py-5 text-center sm:px-6 sm:py-6">
          <span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/30">
            <Gem size={20} className="text-white" />
          </span>
          <h1 className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-fuchsia-400 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">
            {t('hero.title')}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-xs text-arcane-400 sm:text-sm">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      <div className="mx-auto mb-4 max-w-md">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-arcane-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('catalog.search')}
            className="w-full rounded-lg border border-arcane-700 bg-arcane-800 py-2.5 pl-10 pr-4 text-sm text-arcane-100 placeholder-arcane-400 outline-none transition focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/30"
          />
        </div>
      </div>

      <div className="mx-auto mb-4 flex max-w-md flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => handleCategoryChange(null)}
          className={`rounded-lg border px-3 py-1.5 text-sm transition ${
            category === null
              ? 'border-fuchsia-500 bg-arcane-700/60 text-fuchsia-400'
              : 'border-arcane-700 bg-arcane-800 text-arcane-400 hover:text-arcane-100'
          }`}
        >
          {t('catalog.allCategories')}
        </button>
        {CATEGORIES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => handleCategoryChange(item.value)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${
              category === item.value
                ? 'border-fuchsia-500 bg-arcane-700/60 text-fuchsia-400'
                : 'border-arcane-700 bg-arcane-800 text-arcane-400 hover:text-arcane-100'
            }`}
          >
            {t(`artifact.category.${item.value}`)}
          </button>
        ))}
      </div>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 3 }, (_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <PackageOpen size={48} className="text-arcane-700" />
            <h2 className="text-xl font-semibold text-arcane-100">{t('catalog.error')}</h2>
            <p className="max-w-md text-sm text-arcane-400">{error.message}</p>
            <Button variant="secondary" onClick={() => setReloadKey((key) => key + 1)}>
              {t('catalog.retry')}
            </Button>
          </div>
        ) : searchStatus === 'idle' ? (
          artifacts.length === 0 ? (
            <div className="py-16 text-center">
              <PackageOpen size={48} className="mx-auto text-arcane-700" />
              <p className="mt-4 text-sm text-arcane-400">{t('catalog.empty')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {artifacts.map((artifact) => (
                  <ArtifactCard
                    key={artifact.id}
                    artifact={artifact}
                    id={artifact.id}
                    isFavorite={isFavorite(artifact.id)}
                    favoritePending={pendingId === artifact.id}
                    onToggleFavorite={(id) => toggle(id).catch((err) => {
                      if (err.status === 403) {
                        navigate('/login', { replace: true })
                      }
                    })}
                  />
                ))}
              </div>
              {hasMore && (
                <LoadMoreButton
                  label={resolvedLoadMoreLabel}
                  loading={loadingMore}
                  error={loadMoreError}
                  onClick={loadMore}
                />
              )}
            </>
          )
        ) : searchStatus === 'loading' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <SkeletonCard />
          </div>
        ) : searchStatus === 'found' ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {searchResults.length > 0
                ? searchResults.map((artifact) => (
                    <ArtifactCard
                      key={artifact.id}
                      artifact={artifact}
                      id={artifact.id}
                      isFavorite={isFavorite(artifact.id)}
                      favoritePending={pendingId === artifact.id}
                      onToggleFavorite={(id) => toggle(id).catch((err) => {
                        if (err.status === 403) {
                          navigate('/login', { replace: true })
                        }
                      })}
                    />
                  ))
                : searchResult && (
                    <ArtifactCard
                      artifact={searchResult}
                      id={searchResult.id}
                      isFavorite={isFavorite(searchResult.id)}
                      favoritePending={pendingId === searchResult.id}
                      onToggleFavorite={(id) => toggle(id).catch((err) => {
                        if (err.status === 403) {
                          navigate('/login', { replace: true })
                        }
                      })}
                    />
                  )}
            </div>
            {hasMoreSearch && (
              <LoadMoreButton
                label={resolvedLoadMoreLabel}
                loading={searchLoadingMore}
                error={searchLoadMoreError}
                onClick={loadMoreSearch}
              />
            )}
          </>
        ) : (
          <div className="py-16 text-center">
            <PackageOpen size={48} className="mx-auto text-arcane-700" />
            <p className="mt-4 text-sm text-arcane-400">{t('artifact.notfound')}</p>
          </div>
        )}
      </section>
    </>
  )
}
