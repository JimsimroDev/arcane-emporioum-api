import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Loader2, UserRound } from 'lucide-react'
import { changePassword, getUserStatus } from '../api/auth.js'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Spinner } from '../components/ui/Spinner.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useI18n } from '../i18n/I18nProvider.jsx'
import { ROUTES } from '../lib/constants.js'

const inputClasses =
  'w-full rounded-lg border border-arcane-700 bg-arcane-800 px-3.5 py-2.5 text-sm text-arcane-100 outline-none transition-colors placeholder:text-arcane-700 focus:border-fuchsia-500'

function initials(email) {
  if (!email) return '?'
  return email.charAt(0).toUpperCase()
}

export function UserPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { user, isLoggedIn, clearSession } = useAuth()
  const [message, setMessage] = useState(null)
  const [checking, setChecking] = useState(true)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [passError, setPassError] = useState(null)
  const [passNotice, setPassNotice] = useState(null)

  useEffect(() => {
    if (!isLoggedIn) {
      navigate(ROUTES.login, { replace: true })
      return
    }

    let cancelled = false
    setChecking(true)

    getUserStatus()
      .then((data) => {
        if (!cancelled) {
          setMessage(data ?? t('user.granted'))
        }
      })
      .catch((err) => {
        if (err.status === 403) {
          clearSession()
          navigate(ROUTES.login, { replace: true })
        } else if (!cancelled) {
          setMessage(err.message || t('error.generic'))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setChecking(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isLoggedIn, navigate, clearSession, t])

  async function handleChangePassword(event) {
    event.preventDefault()

    if (newPassword !== confirmPassword) {
      setPassError(t('changePassword.mismatch'))
      setPassNotice(null)
      return
    }

    setSubmitting(true)
    setPassError(null)
    setPassNotice(null)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPassNotice(t('changePassword.success'))
    } catch (err) {
      if (err.status === 401) {
        clearSession()
        navigate(ROUTES.login, { replace: true })
      } else {
        setPassError(err.message || t('changePassword.error'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Perfil ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-arcane-700/60 bg-arcane-900 p-8 shadow-[0_0_60px_rgba(217,70,239,0.15)]">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-2xl font-bold text-white shadow-lg shadow-fuchsia-500/30">
              {initials(user?.email)}
            </span>

            <div>
              <h1 className="text-2xl font-bold text-arcane-100">{t('user.title')}</h1>
              <p className="mt-1 text-sm text-arcane-400">{user?.email}</p>
            </div>

            <div className="flex justify-center gap-2">
              <Badge className="border-sky-500/40 bg-sky-500/15 text-sky-300">
                {t('role.label')}: {user.role}
              </Badge>
              <Badge className="border-arcane-700 bg-arcane-800/80 text-arcane-400">
                ID: {user.id}
              </Badge>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-arcane-700/60 bg-arcane-800/60 p-4 text-sm text-arcane-400">
            {checking ? (
              <div className="flex justify-center py-2">
                <Spinner />
              </div>
            ) : (
              <p className="flex items-center gap-2">
                <UserRound size={16} className="shrink-0 text-sky-400" />
                {message ?? t('error.generic')}
              </p>
            )}
          </div>
        </div>

        {/* ── Cambiar contraseña ─────────────────────────────────── */}
        <div className="rounded-2xl border border-arcane-700/60 bg-arcane-900 p-8 shadow-[0_0_60px_rgba(217,70,239,0.15)]">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/30">
              <KeyRound size={22} className="text-white" />
            </span>
            <h2 className="text-xl font-bold text-arcane-100">{t('changePassword.title')}</h2>
          </div>

          <form onSubmit={handleChangePassword} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-arcane-400">{t('changePassword.current')}</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
                className={inputClasses}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-arcane-400">{t('changePassword.newPassword')}</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
                className={inputClasses}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-arcane-400">{t('changePassword.confirmPassword')}</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
                className={inputClasses}
              />
            </label>

            {passError && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {passError}
              </p>
            )}

            {passNotice && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                {passNotice}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="mt-2 w-full">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {t('changePassword.submit')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
