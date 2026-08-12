import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react'
import { register } from '../api/auth.js'
import { Button } from '../components/ui/Button.jsx'
import { useI18n } from '../i18n/I18nProvider.jsx'
import { ROUTES } from '../lib/constants.js'

const inputClasses =
  'w-full rounded-lg border border-arcane-700 bg-arcane-800 px-3.5 py-2.5 text-sm text-arcane-100 outline-none transition-colors placeholder:text-arcane-700 focus:border-fuchsia-500'

export function RegisterPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()

    if (!email.trim() || !password) {
      return
    }

    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch'))
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await register(email.trim(), password)
      navigate(ROUTES.login, { state: { registered: true } })
    } catch (err) {
      const isClientError = err.status >= 400 && err.status < 500
      setError(isClientError ? t('register.error') : t('error.generic'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-arcane-700/60 bg-arcane-900 p-8 shadow-[0_0_60px_rgba(217,70,239,0.15)]">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/30">
              <UserPlus size={24} className="text-white" />
            </span>
            <h1 className="text-xl font-bold text-arcane-100">{t('register.title')}</h1>
            <p className="text-sm text-arcane-400">{t('register.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-arcane-400">{t('register.email')}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClasses}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-arcane-400">{t('register.password')}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className={inputClasses}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-arcane-400">{t('register.confirmPassword')}</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className={inputClasses}
              />
            </label>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="mt-2 w-full">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {t('register.submit')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button as={Link} to={ROUTES.login} variant="ghost" className="-ml-3">
              <ArrowLeft size={14} />
              {t('register.back')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
