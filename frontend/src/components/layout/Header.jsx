import { Link, useNavigate } from 'react-router-dom'
import { Gem, Heart, LogOut, ShieldCheck } from 'lucide-react'
import { LanguageSwitcher } from '../LanguageSwitcher.jsx'
import { Button } from '../ui/Button.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useI18n } from '../../i18n/I18nProvider.jsx'
import { ROUTES } from '../../lib/constants.js'

export function Header() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { user, isLoggedIn, isAdmin, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate(ROUTES.catalog)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-arcane-700/50 bg-arcane-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to={ROUTES.catalog} className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/30">
            <Gem size={20} className="text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight text-arcane-100">
            Arcane{' '}
            <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
              Emporium
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Button as={Link} to={ROUTES.catalog} variant="ghost">
            {t('nav.catalog')}
          </Button>

          {isLoggedIn ? (
            <>
              <Button as={Link} to={ROUTES.favorites} variant="ghost">
                <Heart size={15} />
                <span className="hidden sm:inline">{t('nav.favorites')}</span>
              </Button>
              {isAdmin && (
                <Button as={Link} to={ROUTES.admin} variant="ghost">
                  <ShieldCheck size={15} />
                  <span className="hidden sm:inline">{t('nav.admin')}</span>
                </Button>
              )}
              <span className="hidden text-sm text-arcane-400 md:inline">
                {user.email}
                <span className="ml-1 text-xs text-fuchsia-400">({user.role})</span>
              </span>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut size={15} />
                <span className="hidden sm:inline">{t('nav.logout')}</span>
              </Button>
            </>
          ) : (
            <Button as={Link} to={ROUTES.login}>
              {t('nav.login')}
            </Button>
          )}

          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  )
}
