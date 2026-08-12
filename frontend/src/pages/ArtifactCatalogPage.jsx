import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Gem, PackageOpen, Search } from 'lucide-react'
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

export function ArtifactCatalogPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { favorites, isFavorite, pendingId, toggle } = useFavorites(lang)
  const [artifacts, setArtifacts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [category, setCategory] = useState(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(null)
  const prevLang = useRef(lang)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = category
          ? await fetchArtifactsByCategory(category, lang, page, pageSize)
          : await fetchArtifacts(lang, page, pageSize)
        if (!cancelled) {
          setArtifacts(data.content)
          setTotalPages(data.totalPages ?? 0)
          setCurrentPage(data.number ?? 0)
          if (pageSize === null) setPageSize(data.size ?? null)
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

    if (prevLang.current !== lang) {
      prevLang.current = lang
      if (page !== 0) {
        setPage(0)
        return
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [lang, category, reloadKey, page])

  const [search, setSearch] = useState('')

  const [searchStatus, setSearchStatus] = useState('idle')
  const [searchResult, setSearchResult] = useState(null)
  const [searchResults, setSearchResults] = useState(null)
  const [searchPage, setSearchPage] = useState(0)
  const [searchTotalPages, setSearchTotalPages] = useState(0)
  const prevSearch = useRef('')

  function handleCategoryChange(nextCategory) {
    setCategory(nextCategory)
    setPage(0)
    setSearchStatus('idle')
    setSearchResult(null)
    setSearchResults(null)
  }

  useEffect(() => {
    const q = search.trim()
    if (!q) {
      setSearchStatus('idle')
      setSearchResult(null)
      setSearchResults(null)
      setSearchTotalPages(0)
      return
    }

    if (prevSearch.current !== q) {
      prevSearch.current = q
      if (searchPage !== 0) {
        setSearchPage(0)
        return
      }
    }

    let cancelled = false
    setSearchStatus('loading')

    if (/^\d+$/.test(q)) {
      setSearchTotalPages(0)
      fetchArtifact(Number(q), lang)
        .then((artifact) => {
          if (!cancelled) {
            setSearchResult(artifact)
            setSearchResults(null)
            setSearchStatus('found')
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSearchResult(null)
            setSearchResults(null)
            setSearchStatus('notfound')
          }
        })
      return () => {
        cancelled = true
      }
    }

    searchArtifactsByKeyword(q, lang, searchPage, pageSize)
      .then((data) => {
        if (!cancelled) {
          setSearchResults(data.content)
          setSearchTotalPages(data.totalPages ?? 0)
          if (pageSize === null) setPageSize(data.size ?? null)
          setSearchStatus(data.content.length > 0 ? 'found' : 'notfound')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSearchResults(null)
          setSearchStatus('notfound')
        }
      })
    return () => {
      cancelled = true
    }
  }, [search, searchPage, lang])

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
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label={t('catalog.prev')}
                  className="rounded-lg border border-arcane-700 bg-arcane-800 px-3 py-1.5 text-sm text-arcane-400 transition hover:text-arcane-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>
                <span aria-label={t('catalog.page')} className="text-sm text-arcane-400">
                  {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  aria-label={t('catalog.next')}
                  className="rounded-lg border border-arcane-700 bg-arcane-800 px-3 py-1.5 text-sm text-arcane-400 transition hover:text-arcane-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
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
              {searchResults ? (
                searchResults.map((artifact) => (
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
              ) : (
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
            {searchTotalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSearchPage((p) => Math.max(0, p - 1))}
                  disabled={searchPage === 0}
                  aria-label={t('catalog.prev')}
                  className="rounded-lg border border-arcane-700 bg-arcane-800 px-3 py-1.5 text-sm text-arcane-400 transition hover:text-arcane-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>
                <span aria-label={t('catalog.page')} className="text-sm text-arcane-400">
                  {searchPage + 1} / {searchTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setSearchPage((p) => Math.min(searchTotalPages - 1, p + 1))}
                  disabled={searchPage >= searchTotalPages - 1}
                  aria-label={t('catalog.next')}
                  className="rounded-lg border border-arcane-700 bg-arcane-800 px-3 py-1.5 text-sm text-arcane-400 transition hover:text-arcane-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-16 text-center">
            <PackageOpen size={48} className="mx-auto text-arcane-700" />
            <p className="mt-4 text-sm text-arcane-400">
              {searchStatus === 'invalid' ? t('catalog.search') : t('artifact.notfound')}
            </p>
          </div>
        )}
      </section>
    </>
  )
}
