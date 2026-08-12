import { CATEGORY_META, RARITY_VARIANTS } from '../../lib/constants.js'

const DOT_PATTERN = {
  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)',
  backgroundSize: '16px 16px',
}

const RADIAL_GLOW = {
  backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(255,255,255,0.35), transparent 60%)',
}

const ICON_SIZES = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
}

const PLACEHOLDER_IMAGE = 'cualquierImagen'

export function ArtifactArtwork({ category, rarity, size = 'md', className = '', imageUrl }) {
  const rarityMeta = RARITY_VARIANTS[rarity] ?? RARITY_VARIANTS.COMMON
  const categoryMeta = CATEGORY_META[category]
  const Icon = categoryMeta?.Icon
  const hasRealImage =
    typeof imageUrl === 'string' && imageUrl.trim() !== '' && imageUrl !== PLACEHOLDER_IMAGE

  return (
    <div
      className={`relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-gradient-to-br ${rarityMeta.gradient} ${className}`}
    >
      {hasRealImage ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <div className="absolute inset-0" style={DOT_PATTERN} />
          <div className="absolute inset-0" style={RADIAL_GLOW} />
          <div className="relative flex h-full w-full items-center justify-center">
            {Icon && (
              <Icon
                size={96}
                strokeWidth={1.5}
                className={`${ICON_SIZES[size]} text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]`}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
