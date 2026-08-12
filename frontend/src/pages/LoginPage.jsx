import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Gem, Loader2 } from 'lucide-react'
import { login } from '../api/auth.js'
import { Button } from '../components/ui/Button.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useI18n } from '../i18n/I18nProvider.jsx'
import { ROUTES } from '../lib/constants.js'

const inputClasses =
  'w-full rounded-lg border border-arcane-700 bg-arcane-800 px-3.5 py-2.5 text-sm text-arcane-100 outline-none transition-colors placeholder:text-arcane-700 focus:border-fuchsia-500'

export function LoginPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const { saveUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const registered = Boolean(location.state?.registered)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim() || !password) {
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const user = await login(email.trim(), password)
      saveUser(user)
      navigate(user.role === 'ADMIN' ? ROUTES.admin : ROUTES.user, { replace: true })
    } catch (err) {
      setError(err.status === 401 ? t('login.error') : err.message || t('error.generic'))
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
              <Gem size={24} className="text-white" />
            </span>
            <h1 className="text-xl font-bold text-arcane-100">{t('login.title')}</h1>
            <p className="text-sm text-arcane-400">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {registered && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                {t('register.success')}
              </p>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-arcane-400">{t('login.username')}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="admin"
                className={inputClasses}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-arcane-400">{t('login.password')}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="1234"
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
              {t('login.submit')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-arcane-400 transition-colors hover:text-arcane-100"
            >
              {t('login.forgotPassword')}
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link
              to={ROUTES.register}
              className="text-sm text-fuchsia-300 transition-colors hover:text-fuchsia-200"
            >
              {t('register.prompt')}
            </Link>
          </div>

          <div className="mt-6 rounded-xl border border-arcane-700/60 bg-arcane-800/60 p-4 text-center">
            <p className="mb-2 text-xs uppercase tracking-wider text-arcane-400">
              {t('login.demoHints')}
            </p>
            <p className="text-sm text-arcane-100">correo@prueba.com / 123456</p>
          </div>

          <div className="mt-6 text-center">
            <Button as={Link} to="/" variant="ghost" className="-ml-3">
              <ArrowLeft size={14} />
              {t('artifact.back')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
