import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, Loader2, Minus, PackageX, Plus } from 'lucide-react'
import { createOrder } from '../api/orders.js'
import { ArtifactArtwork } from '../components/artifact/ArtifactArtwork.jsx'
import { CategoryBadge } from '../components/artifact/CategoryBadge.jsx'
import { PriceTag } from '../components/artifact/PriceTag.jsx'
import { RarityBadge } from '../components/artifact/RarityBadge.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Spinner } from '../components/ui/Spinner.jsx'
import { useArtifact } from '../hooks/useArtifact.js'
import { useI18n } from '../i18n/I18nProvider.jsx'
import { ROUTES } from '../lib/constants.js'

// Locales equivalentes a los que el backend usa al formatear precios.
const PRICE_LOCALES = { es: 'es-CO', en: 'en-US', pt: 'pt-BR' }

// El endpoint de pedidos no devuelve precio ni total: el total se calcula en el
// cliente y se formatea igual que el backend (PriceFormatted), reutilizando el
// código de moneda que ya viaja en `priceFormatted`.
function formatTotal(price, quantity, priceFormatted, lang) {
  const number = new Intl.NumberFormat(PRICE_LOCALES[lang] ?? lang).format(price * quantity)
  const parts = (priceFormatted ?? '').trim().split(/\s+/)
  const currency = parts.length > 1 ? parts[parts.length - 1] : ''
  return currency ? `${number} ${currency}` : number
}

// Interpolación mínima de {0}: sustituye el id del pedido, no traduce nada.
function interpolateOrderId(label, orderId) {
  return label.replace(/\{0\}/g, String(orderId))
}

const ORDER_ERROR_KEYS = {
  401: 'order.error.unauthorized',
  404: 'order.error.notFound',
  409: 'order.error.conflict',
}

function orderErrorMessage(t, status) {
  return t(ORDER_ERROR_KEYS[status] ?? 'order.error.generic')
}

const stepperButtonClasses =
  'grid h-9 w-9 place-items-center rounded-lg border border-arcane-700 bg-arcane-800 text-arcane-100 transition-all duration-200 hover:border-fuchsia-500/60 hover:text-fuchsia-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/70 disabled:pointer-events-none disabled:opacity-50'

function OrderSuccessView({ order }) {
  const { t } = useI18n()

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
      <span className="grid h-16 w-16 place-items-center rounded-full border border-emerald-500/40 bg-emerald-500/15 shadow-[0_0_40px_rgba(52,211,153,0.2)]">
        <Check size={32} className="text-emerald-300" />
      </span>
      <h1 className="text-2xl font-bold text-arcane-100 sm:text-3xl">{t('order.successTitle')}</h1>
      <p className="max-w-md text-sm text-arcane-400" aria-live="polite">
        {interpolateOrderId(t('order.successMessage'), order.id)}
      </p>
      <Badge className="border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-300">
        {t(`order.status.${order.status}`)}
      </Badge>
      <Button as={Link} to={ROUTES.catalog} className="mt-2">
        {t('order.continueShopping')}
      </Button>
    </div>
  )
}

export function CheckoutPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const artifactParam = searchParams.get('artifact')
  const artifactId = artifactParam !== null && /^\d+$/.test(artifactParam) ? Number(artifactParam) : null

  const { data: artifact, loading, error, retry } = useArtifact(artifactId ?? 0, lang)

  const [quantity, setQuantity] = useState(1)
  const [order, setOrder] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [orderError, setOrderError] = useState(null)

  // 401: muestra el aviso y redirige a /login conservando el artefacto como
  // query param para poder volver al checkout tras iniciar sesión.
  useEffect(() => {
    if (orderError?.status !== 401) return
    const timer = window.setTimeout(() => {
      navigate(`${ROUTES.login}?artifact=${artifactId}`, { replace: true })
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [orderError, navigate, artifactId])

  const total = useMemo(
    () => (artifact ? formatTotal(artifact.price, quantity, artifact.priceFormatted, lang) : ''),
    [artifact, quantity, lang],
  )

  async function handleConfirm(event) {
    event.preventDefault()
    if (!artifact || submitting) return
    setSubmitting(true)
    setOrderError(null)
    try {
      setOrder(await createOrder({ artifactId: artifact.id, quantity, lang }))
    } catch (err) {
      setOrderError({ status: err.status ?? 0 })
    } finally {
      setSubmitting(false)
    }
  }

  if (artifactId === null) {
    return <Navigate to={ROUTES.catalog} replace />
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-24 sm:px-6">
        <Spinner />
        <p className="text-sm text-arcane-400">{t('catalog.loading')}</p>
      </div>
    )
  }

  if (error) {
    const notFound = error.status === 404
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
        <PackageX size={48} className="text-arcane-700" />
        <h1 className="text-2xl font-bold text-arcane-100">
          {notFound ? t('artifact.notfound') : t('catalog.error')}
        </h1>
        <p className="max-w-md text-sm text-arcane-400">
          {notFound ? t('artifact.notfound.message') : error.message}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {!notFound && (
            <Button variant="secondary" onClick={retry}>
              {t('catalog.retry')}
            </Button>
          )}
          <Button as={Link} to={ROUTES.catalog}>
            {t('backToCatalog')}
          </Button>
        </div>
      </div>
    )
  }

  if (order) {
    return <OrderSuccessView order={order} />
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Button as={Link} to={`/artifact/${artifactId}`} variant="ghost" className="-ml-3 mb-8">
        <ArrowLeft size={16} />
        {t('artifact.back')}
      </Button>

      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-arcane-100">{t('order.checkoutTitle')}</h1>

        <Card className="mt-6 overflow-hidden">
          <div className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex gap-4 sm:gap-6">
              <div className="w-28 shrink-0 sm:w-36">
                <ArtifactArtwork
                  category={artifact.category}
                  rarity={artifact.rarity}
                  size="sm"
                  imageUrl={artifact.imageUrl}
                  className="border border-arcane-700/60"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <RarityBadge rarity={artifact.rarity} />
                  <CategoryBadge category={artifact.category} />
                </div>
                <h2 className="text-lg font-semibold leading-snug text-arcane-100">
                  {artifact.title}
                </h2>
                <PriceTag
                  formatted={artifact.priceFormatted}
                  price={artifact.price}
                  className="text-fuchsia-400"
                />
              </div>
            </div>

            <form onSubmit={handleConfirm} className="flex flex-col gap-4 border-t border-arcane-700/60 pt-6">
              <div className="flex items-center justify-between gap-4">
                <span id="checkout-quantity-label" className="text-sm font-medium text-arcane-400">
                  {t('order.quantity')}
                </span>
                <div className="flex items-center gap-1" role="group" aria-labelledby="checkout-quantity-label">
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    disabled={quantity <= 1 || submitting}
                    aria-label={`${t('order.quantity')}: −`}
                    className={stepperButtonClasses}
                  >
                    <Minus size={16} />
                  </button>
                  <span aria-live="polite" className="w-10 text-center text-sm font-semibold text-arcane-100">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => current + 1)}
                    disabled={submitting}
                    aria-label={`${t('order.quantity')}: +`}
                    className={stepperButtonClasses}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-arcane-400">{t('order.total')}</span>
                <span className="text-2xl font-bold text-fuchsia-400">{total}</span>
              </div>

              {orderError && (
                <div
                  role="alert"
                  className="flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
                >
                  <p className="text-sm text-red-300">{orderErrorMessage(t, orderError.status)}</p>
                  {orderError.status === 401 ? (
                    <Button as={Link} to={`${ROUTES.login}?artifact=${artifactId}`}>
                      {t('order.loginRequired')}
                    </Button>
                  ) : orderError.status === 404 || orderError.status === 409 ? (
                    <Button as={Link} to={`/artifact/${artifactId}`} variant="secondary">
                      {t('artifact.back')}
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" onClick={handleConfirm}>
                      {t('catalog.retry')}
                    </Button>
                  )}
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full" aria-live="polite">
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? t('order.processing') : t('order.confirm')}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
