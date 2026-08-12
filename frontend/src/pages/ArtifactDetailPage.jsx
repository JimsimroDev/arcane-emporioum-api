import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, PackageX } from 'lucide-react'
import { useArtifact } from '../hooks/useArtifact.js'
import { ArtifactArtwork } from '../components/artifact/ArtifactArtwork.jsx'
import { CategoryBadge } from '../components/artifact/CategoryBadge.jsx'
import { PriceTag } from '../components/artifact/PriceTag.jsx'
import { RarityBadge } from '../components/artifact/RarityBadge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Spinner } from '../components/ui/Spinner.jsx'
import { useI18n } from '../i18n/I18nProvider.jsx'
import { CATEGORY_META, RARITY_VARIANTS } from '../lib/constants.js'

function InfoTile({ label, children }) {
  return (
    <div className="rounded-xl border border-arcane-700/60 bg-arcane-900 p-4">
      <p className="text-xs uppercase tracking-wider text-arcane-400">{label}</p>
      <div className="mt-1 text-lg font-bold text-arcane-100">{children}</div>
    </div>
  )
}

export function ArtifactDetailPage() {
  const { id } = useParams()
  const { t, lang } = useI18n()
  const { data: artifact, loading, error, retry } = useArtifact(id, lang)

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
          <Button as={Link} to="/">
            {t('backToCatalog')}
          </Button>
        </div>
      </div>
    )
  }

  const rarityMeta = RARITY_VARIANTS[artifact.rarity] ?? RARITY_VARIANTS.COMMON
  const categoryMeta = CATEGORY_META[artifact.category]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Button as={Link} to="/" variant="ghost" className="-ml-3 mb-8">
        <ArrowLeft size={16} />
        {t('artifact.back')}
      </Button>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
        <ArtifactArtwork
          category={artifact.category}
          rarity={artifact.rarity}
          size="lg"
          imageUrl={artifact.imageUrl}
          className="rounded-2xl border border-arcane-700/60 shadow-[0_0_60px_rgba(217,70,239,0.2)]"
        />

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <RarityBadge rarity={artifact.rarity} />
            <CategoryBadge category={artifact.category} />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-arcane-100 sm:text-4xl">{artifact.title}</h1>
            <p className="mt-4 leading-relaxed text-arcane-400">{artifact.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoTile label={t('artifact.price')}>
              <PriceTag formatted={artifact.priceFormatted} price={artifact.price} className="text-fuchsia-400" />
            </InfoTile>
            <InfoTile label={t('artifact.requiredLevel')}>{artifact.requiredLevel}</InfoTile>
            <InfoTile label={t('artifact.category')}>
              {categoryMeta
                ? t(`artifact.category.${artifact.category.toLowerCase()}`)
                : artifact.category}
            </InfoTile>
            <InfoTile label={t('artifact.rarity')}>
              <span className={rarityMeta.text}>
                {t(`artifact.rarity.${artifact.rarity.toLowerCase()}`)}
              </span>
            </InfoTile>
          </div>

          {artifact.inStock ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              {t('artifact.available')}
            </span>
          ) : (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-sm font-medium text-red-300">
              <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
              {t('artifact.outOfStock')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
