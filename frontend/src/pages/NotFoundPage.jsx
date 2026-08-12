import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { useI18n } from '../i18n/I18nProvider.jsx'

export function NotFoundPage() {
  const { t } = useI18n()

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
      <Compass size={56} className="text-arcane-700" />
      <h1 className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-6xl font-black text-transparent">
        {t('notFound.title')}
      </h1>
      <p className="text-arcane-400">{t('notFound.message')}</p>
      <Button as={Link} to="/" className="mt-2">
        {t('notFound.back')}
      </Button>
    </div>
  )
}
