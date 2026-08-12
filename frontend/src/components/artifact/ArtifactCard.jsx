import { Link } from 'react-router-dom'
import { ArrowRight, Heart, Loader2 } from 'lucide-react'
import { ArtifactArtwork } from './ArtifactArtwork.jsx'
import { CategoryBadge } from './CategoryBadge.jsx'
import { RarityBadge } from './RarityBadge.jsx'
import { PriceTag } from './PriceTag.jsx'
import { useI18n } from '../../i18n/I18nProvider.jsx'

export function ArtifactCard({ artifact, id, isFavorite = false, favoritePending = false, onToggleFavorite }) {
  const { t } = useI18n()

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-arcane-700/60 bg-arcane-900 transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-500/60 hover:shadow-[0_0_30px_rgba(217,70,239,0.25)]">
      <div className="relative p-3 pb-0">
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(id)}
            disabled={favoritePending}
            aria-label={t('favorites.toggle')}
            className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-arcane-700/60 bg-arcane-950/70 text-arcane-300 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:border-fuchsia-500/60 hover:text-fuchsia-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/70 disabled:pointer-events-none disabled:opacity-60"
          >
            {favoritePending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Heart
                size={16}
                fill={isFavorite ? 'currentColor' : 'none'}
                className={isFavorite ? 'text-fuchsia-400' : 'text-arcane-300'}
              />
            )}
          </button>
        )}
        <ArtifactArtwork category={artifact.category} rarity={artifact.rarity} imageUrl={artifact.imageUrl} />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <RarityBadge rarity={artifact.rarity} />
          <CategoryBadge category={artifact.category} />
        </div>

        <h3 className="text-sm font-semibold leading-snug text-arcane-100">{artifact.title}</h3>

        <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-arcane-400">
          {artifact.description}
        </p>

        <div className="flex items-center justify-between gap-2 border-t border-arcane-700/40 pt-2">
          <PriceTag
            formatted={artifact.priceFormatted}
            price={artifact.price}
            className="text-base font-bold text-fuchsia-400"
          />
          <Link
            to={`/artifact/${id}`}
            className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg shadow-fuchsia-500/25 transition-all duration-200 hover:brightness-110"
          >
            {t('artifact.viewDetails')}
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </article>
  )
}
