import { Badge } from '../ui/Badge.jsx'
import { CATEGORY_META } from '../../lib/constants.js'
import { useI18n } from '../../i18n/I18nProvider.jsx'

export function CategoryBadge({ category }) {
  const { t } = useI18n()
  const meta = CATEGORY_META[category]
  if (!meta) {
    return null
  }
  const Icon = meta.Icon

  return (
    <Badge className="border-arcane-700 bg-arcane-800/80 text-arcane-400">
      <Icon size={12} className={meta.color} />
      {t(`artifact.category.${category.toLowerCase()}`)}
    </Badge>
  )
}
