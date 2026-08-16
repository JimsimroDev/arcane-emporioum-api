import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, PackageX, ScrollText } from 'lucide-react'
import { getMyOrders } from '../api/orders.js'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Spinner } from '../components/ui/Spinner.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useI18n } from '../i18n/I18nProvider.jsx'
import { ROUTES } from '../lib/constants.js'
import { LOAD_MORE_LABELS } from '../lib/loadMoreLabels.js'

// Locales equivalentes a los que el backend usa al formatear precios y fechas.
const ORDER_PRICE_LOCALES = { es: 'es-CO', en: 'en-US', pt: 'pt-BR' }
const ORDER_CURRENCIES = { es: 'COP', en: 'USD', pt: 'BRL' }

// Mismo formato que PriceFormatted del backend:
// Intl.NumberFormat(numberLocale).format(amount) + ' ' + currencyCode.
function formatMoney(amount, lang) {
  const number = new Intl.NumberFormat(ORDER_PRICE_LOCALES[lang] ?? lang).format(amount)
  return `${number} ${ORDER_CURRENCIES[lang] ?? ''}`
}

function formatDate(iso, lang) {
  return new Intl.DateTimeFormat(ORDER_PRICE_LOCALES[lang] ?? lang, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

const PAGE_SIZE = 10

function OrderCard({ order, lang }) {
  const { t } = useI18n()

  return (
    <Card className="flex flex-col gap-4 p-5 transition-all duration-200 hover:border-fuchsia-500/40 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-arcane-100">#{order.id}</p>
          <p className="mt-0.5 text-xs text-arcane-400">{formatDate(order.createdAt, lang)}</p>
        </div>
        <Badge className="border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-300">
          {t(`order.status.${order.status}`)}
        </Badge>
      </div>

      <ul className="flex flex-col gap-2 border-t border-arcane-700/60 pt-4">
        {order.lines?.map((line) => (
          <li key={line.artifactId} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-arcane-100">
              {line.quantity} × {line.title}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-arcane-700/60 pt-4">
        <span className="text-sm font-medium text-arcane-400">{t('order.total')}</span>
        <span className="text-lg font-bold text-fuchsia-400">{formatMoney(order.total, lang)}</span>
      </div>
    </Card>
  )
}

export function OrdersPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { isLoggedIn, clearSession } = useAuth()

  const [orders, setOrders] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Guarda de sesión: sin usuario autenticado se sale de la página.
  useEffect(() => {
    if (!isLoggedIn) {
      navigate(ROUTES.login, { replace: true })
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getMyOrders({ page: 0, size: PAGE_SIZE, lang })
      .then((data) => {
        if (cancelled) return
        setOrders(data.content ?? [])
        setTotalElements(data.totalElements ?? 0)
        setPage(data.number ?? 0)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.status === 401) {
          clearSession()
          navigate(ROUTES.login, { replace: true })
          return
        }
        setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isLoggedIn, lang, reloadKey, navigate, clearSession])

  const hasMore = orders.length < totalElements
  const loadMoreLabel = LOAD_MORE_LABELS[lang] ?? LOAD_MORE_LABELS.en

  async function loadMore() {
    setLoadingMore(true)
    setLoadMoreError(null)
    try {
      const next = page + 1
      const data = await getMyOrders({ page: next, size: PAGE_SIZE, lang })
      setOrders((current) => [...current, ...(data.content ?? [])])
      setTotalElements(data.totalElements ?? 0)
      setPage(data.number ?? next)
    } catch (err) {
      if (err.status === 401) {
        clearSession()
        navigate(ROUTES.login, { replace: true })
        return
      }
      setLoadMoreError(err)
    } finally {
      setLoadingMore(false)
    }
  }

  // Sin sesión aún: el guard ya está redirigiendo, no renderizamos nada.
  if (!isLoggedIn) {
    return null
  }

  let content
  if (loading) {
    content = (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <Spinner />
        <p className="text-sm text-arcane-400">{t('catalog.loading')}</p>
      </div>
    )
  } else if (error) {
    content = (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <PackageX size={48} className="text-arcane-700" />
        <h2 className="text-xl font-semibold text-arcane-100">{t('catalog.error')}</h2>
        <p className="max-w-md text-sm text-arcane-400">{error.message}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={() => setReloadKey((key) => key + 1)}>
            {t('catalog.retry')}
          </Button>
          <Button as={Link} to={ROUTES.catalog}>
            {t('backToCatalog')}
          </Button>
        </div>
      </div>
    )
  } else if (orders.length === 0) {
    content = (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <ScrollText size={48} className="text-arcane-700" />
        <p className="max-w-md text-sm text-arcane-400">{t('orders.empty')}</p>
        <Button as={Link} to={ROUTES.catalog}>
          {t('backToCatalog')}
        </Button>
      </div>
    )
  } else {
    content = (
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} lang={lang} />
        ))}
        {hasMore && (
          <div className="mt-2 flex flex-col items-center gap-2" aria-live="polite">
            <Button
              variant="secondary"
              onClick={loadMore}
              disabled={loadingMore}
              className="transition-all duration-200"
            >
              {loadingMore && <Loader2 size={16} className="animate-spin" />}
              {loadMoreLabel}
            </Button>
            {loadMoreError && (
              <p className="text-xs text-arcane-400">{loadMoreError.message}</p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-bold text-arcane-100 sm:text-3xl">{t('orders.title')}</h1>
      <section className="mt-6" aria-live="polite">
        {content}
      </section>
    </div>
  )
}
