import { Badge } from '../ui/Badge.jsx'
import { RARITY_VARIANTS } from '../../lib/constants.js'
import { useI18n } from '../../i18n/I18nProvider.jsx'

export function RarityBadge({ rarity }) {
  const { t } = useI18n()
  const meta = RARITY_VARIANTS[rarity] ?? RARITY_VARIANTS.COMMON

  return (
    <Badge className={meta.badge}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} shadow-[0_0_8px_currentColor]`} />
      {t(`artifact.rarity.${rarity.toLowerCase()}`)}
    </Badge>
  )
}
