import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, HeartOff, PackageOpen } from 'lucide-react'
import { ArtifactCard } from '../components/artifact/ArtifactCard.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useFavorites } from '../hooks/useFavorites.js'
import { useI18n } from '../i18n/I18nProvider.jsx'
import { ROUTES } from '../lib/constants.js'

function SkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <div className="p-3 pb-0">
        <div className="aspect-[4/3] animate-pulse rounded-xl bg-arcane-800" />
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

export function FavoritesPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { isLoggedIn, clearSession } = useAuth()
  const { favorites, loading, error, pendingId, toggle, retry, page, totalPages, setPage } = useFavorites(lang)

  useEffect(() => {
    if (!isLoggedIn) {
      navigate(ROUTES.login, { replace: true })
    }
  }, [isLoggedIn, navigate])

  useEffect(() => {
    if (error?.status === 403) {
      clearSession()
      navigate(ROUTES.login, { replace: true })
    }
  }, [error, clearSession, navigate])

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-arcane-100">{t('favorites.title')}</h1>

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <PackageOpen size={48} className="text-arcane-700" />
          <h2 className="text-xl font-semibold text-arcane-100">{t('catalog.error')}</h2>
          <p className="max-w-md text-sm text-arcane-400">{error.message}</p>
          <Button variant="secondary" onClick={retry}>
            {t('catalog.retry')}
          </Button>
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <HeartOff size={48} className="text-arcane-700" />
          <p className="max-w-md text-sm text-arcane-400">{t('favorites.empty')}</p>
          <Button as={Link} to={ROUTES.catalog}>
            {t('nav.catalog')}
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((artifact) => (
              <ArtifactCard
                key={artifact.id}
                artifact={artifact}
                id={artifact.id}
                isFavorite
                favoritePending={pendingId === artifact.id}
                onToggleFavorite={(id) =>
                  toggle(id).catch((err) => {
                    if (err?.status === 403) {
                      navigate(ROUTES.login)
                    }
                  })
                }
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                aria-label={t('favorites.prev')}
                className="rounded-lg border border-arcane-700 bg-arcane-800 px-3 py-1.5 text-sm text-arcane-400 transition hover:text-arcane-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              <span aria-label={t('favorites.page')} className="text-sm text-arcane-400">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                aria-label={t('favorites.next')}
                className="rounded-lg border border-arcane-700 bg-arcane-800 px-3 py-1.5 text-sm text-arcane-400 transition hover:text-arcane-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
