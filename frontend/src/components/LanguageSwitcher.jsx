import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider.jsx'

const LANGUAGES = [
  { value: 'es' },
  { value: 'en' },
  { value: 'pt' },
]

const itemClasses =
  'flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-arcane-100 outline-none data-[highlighted]:bg-arcane-700/60'

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={t('language.switcher')}
          className="inline-flex items-center gap-2 rounded-lg border border-arcane-700 px-3 py-2 text-sm text-arcane-400 transition-colors hover:bg-arcane-800/60 hover:text-arcane-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/70"
        >
          <Globe size={16} />
          <span className="uppercase">{lang}</span>
          <ChevronDown size={14} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[150px] rounded-xl border border-arcane-700 bg-arcane-800 p-1 shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
        >
          {LANGUAGES.map((language) => (
            <DropdownMenu.Item
              key={language.value}
              onSelect={() => setLang(language.value)}
              className={itemClasses}
            >
              <span>{t(`language.${language.value}`)}</span>
              {lang === language.value && <Check size={16} className="text-fuchsia-400" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
