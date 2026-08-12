import { Gem } from 'lucide-react'
import { useI18n } from '../../i18n/I18nProvider.jsx'

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-arcane-700/50 bg-arcane-900/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center sm:px-6">
        <span className="flex items-center gap-2 text-sm font-semibold text-arcane-100">
          <Gem size={16} className="text-fuchsia-400" />
          Arcane Emporium
        </span>
        <p className="text-xs text-arcane-400">{t('footer.tagline')}</p>
        <p className="text-xs text-arcane-700">
          © {new Date().getFullYear()} Arcane Emporium · {t('footer.rights')}
        </p>
      </div>
    </footer>
  )
}
