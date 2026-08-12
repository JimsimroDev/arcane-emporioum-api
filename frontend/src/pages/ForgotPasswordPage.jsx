import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Gem, Loader2, MailCheck } from 'lucide-react'
import { requestPasswordReset } from '../api/auth.js'
import { Button } from '../components/ui/Button.jsx'
import { useI18n } from '../i18n/I18nProvider.jsx'

const inputClasses =
  'w-full rounded-lg border border-arcane-700 bg-arcane-800 px-3.5 py-2.5 text-sm text-arcane-100 outline-none transition-colors placeholder:text-arcane-700 focus:border-fuchsia-500'

export function ForgotPasswordPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim()) {
      return
    }

    setSubmitting(true)
    try {
      await requestPasswordReset(email.trim())
    } catch {
      // We deliberately swallow backend errors here: the user must not be able
      // to tell whether an email is registered (user enumeration).
    } finally {
      setSubmitting(false)
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-arcane-700/60 bg-arcane-900 p-8 text-center shadow-[0_0_60px_rgba(217,70,239,0.15)]">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/30">
              <MailCheck size={24} className="text-white" />
            </span>
            <h1 className="text-xl font-bold text-arcane-100">{t('forgotPassword.title')}</h1>
            <p className="mt-3 text-sm leading-relaxed text-arcane-400">
              {t('forgotPassword.success')}
            </p>
            <div className="mt-6 text-center">
              <Button as={Link} to="/login" variant="ghost" className="-ml-3">
                <ArrowLeft size={14} />
                {t('forgotPassword.back')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-arcane-700/60 bg-arcane-900 p-8 shadow-[0_0_60px_rgba(217,70,239,0.15)]">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/30">
              <Gem size={24} className="text-white" />
            </span>
            <h1 className="text-xl font-bold text-arcane-100">{t('forgotPassword.title')}</h1>
            <p className="text-sm text-arcane-400">{t('forgotPassword.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-arcane-400">{t('forgotPassword.email')}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClasses}
              />
            </label>

            <Button type="submit" disabled={submitting} className="mt-2 w-full">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {t('forgotPassword.submit')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button as={Link} to="/login" variant="ghost" className="-ml-3">
              <ArrowLeft size={14} />
              {t('forgotPassword.back')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
