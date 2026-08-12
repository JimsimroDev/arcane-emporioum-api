import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Gem, KeyRound, Loader2 } from 'lucide-react'
import { resetPassword } from '../api/auth.js'
import { Button } from '../components/ui/Button.jsx'
import { useI18n } from '../i18n/I18nProvider.jsx'

const inputClasses =
  'w-full rounded-lg border border-arcane-700 bg-arcane-800 px-3.5 py-2.5 text-sm text-arcane-100 outline-none transition-colors placeholder:text-arcane-700 focus:border-fuchsia-500'

export function ResetPasswordPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()

    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.passwordMismatch'))
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await resetPassword(token, newPassword)
      setDone(true)
    } catch {
      // The token may be missing, expired or already used.
      setError(t('resetPassword.invalidLink'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-arcane-700/60 bg-arcane-900 p-8 text-center shadow-[0_0_60px_rgba(217,70,239,0.15)]">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/30">
              <KeyRound size={24} className="text-white" />
            </span>
            <h1 className="text-xl font-bold text-arcane-100">{t('resetPassword.title')}</h1>
            <p className="mt-3 text-sm text-arcane-400">{t('resetPassword.invalidLink')}</p>
            <div className="mt-6 text-center">
              <Button as={Link} to="/login" variant="ghost" className="-ml-3">
                <ArrowLeft size={14} />
                {t('resetPassword.back')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-arcane-700/60 bg-arcane-900 p-8 text-center shadow-[0_0_60px_rgba(217,70,239,0.15)]">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/30">
              <CheckCircle2 size={24} className="text-white" />
            </span>
            <h1 className="text-xl font-bold text-arcane-100">{t('resetPassword.title')}</h1>
            <p className="mt-3 text-sm text-arcane-400">{t('resetPassword.success')}</p>
            <div className="mt-6">
              <Button as={Link} to="/login" className="w-full">
                {t('resetPassword.back')}
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
              <KeyRound size={24} className="text-white" />
            </span>
            <h1 className="text-xl font-bold text-arcane-100">{t('resetPassword.title')}</h1>
            <p className="text-sm text-arcane-400">{t('resetPassword.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-arcane-400">{t('resetPassword.newPassword')}</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                className={inputClasses}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-arcane-400">{t('resetPassword.confirmPassword')}</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
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
              {t('resetPassword.submit')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button as={Link} to="/login" variant="ghost" className="-ml-3">
              <ArrowLeft size={14} />
              {t('resetPassword.back')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
