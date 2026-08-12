import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Loader2, ShieldCheck, Trash2 } from 'lucide-react'
import { deleteUser, getAdminStatus, getUsers, updateRole } from '../api/auth.js'
import { Badge } from '../components/ui/Badge.jsx'
import { Spinner } from '../components/ui/Spinner.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useI18n } from '../i18n/I18nProvider.jsx'
import { ROUTES } from '../lib/constants.js'

const roleButtonBase =
  'inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50'
const roleButtonActive = 'border-fuchsia-500/50 bg-fuchsia-500/20 text-fuchsia-200'
const roleButtonInactive = 'border-arcane-700 bg-transparent text-arcane-400 hover:bg-arcane-800'
const deleteButtonBase =
  'inline-flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:pointer-events-none disabled:opacity-50'

export function AdminPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { user, isLoggedIn, clearSession } = useAuth()
  const [message, setMessage] = useState(null)
  const [checking, setChecking] = useState(true)
  const [statusOk, setStatusOk] = useState(false)

  const [users, setUsers] = useState(null)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [pendingId, setPendingId] = useState(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageSize, setPageSize] = useState(null)

  useEffect(() => {
    if (!isLoggedIn) {
      navigate(ROUTES.login, { replace: true })
      return
    }

    let cancelled = false
    setChecking(true)

    getAdminStatus()
      .then((data) => {
        if (!cancelled) {
          setStatusOk(true)
          setMessage(data ?? t('admin.granted'))
        }
      })
      .catch((err) => {
        if (err.status === 403) {
          clearSession()
          navigate(ROUTES.login, { replace: true })
        } else if (!cancelled) {
          setStatusOk(false)
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

  useEffect(() => {
    if (!statusOk) {
      return
    }

    let cancelled = false
    setLoadingUsers(true)
    setUsersError(null)

    getUsers(page, pageSize)
      .then((data) => {
        if (!cancelled) {
          setUsers(data.content)
          setTotalPages(data.totalPages ?? 0)
          if (pageSize === null) setPageSize(data.size ?? null)
        }
      })
      .catch((err) => {
        if (err.status === 401 || err.status === 403) {
          clearSession()
          navigate(ROUTES.login, { replace: true })
        } else if (!cancelled) {
          setUsersError(err.message || t('error.generic'))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingUsers(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [statusOk, page, navigate, clearSession, t])

  async function handleRoleChange(targetUser, targetRole) {
    // No-op: clicar sobre el rol que ya tiene no hace nada.
    if (targetUser.role === targetRole) return

    // Guardia de seguridad: un admin no puede quitarse su propio rol ADMIN.
    // El login ya devuelve el id (contrato actualizado), así que nos identificamos por id.
    if (user?.id === targetUser.id && targetRole === 'USER') {
      setUsersError(t('admin.cannotChangeOwnRole'))
      setNotice(null)
      return
    }

    // Confirmación antes de degradar a otro administrador.
    if (targetUser.role === 'ADMIN' && targetRole === 'USER') {
      const confirmed = window.confirm(`${t('admin.confirmDemote')} ${targetUser.email}?`)
      if (!confirmed) return
    }

    setPendingId(targetUser.id)
    setUsersError(null)
    setNotice(null)
    try {
      // El backend devuelve el usuario ya actualizado: lo usamos para
      // reemplazar SOLO esa fila y evitar volver a pedir toda la lista.
      const updated = await updateRole(targetUser.id, targetRole)
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)))
      setNotice(t('admin.roleUpdated'))
    } catch (err) {
      // 401 = sesión realmente inválida -> salir.
      // 403 NO siempre significa sesión inválida: puede ser un rechazo puntual del
      // servidor (p.ej. CORS). Borrar la sesión a la ligera expulsa al usuario
      // sin motivo, así que solo mostramos el error y conservamos la sesión.
      if (err.status === 401) {
        clearSession()
        navigate(ROUTES.login, { replace: true })
      } else {
        setUsersError(err.message || t('error.generic'))
      }
    } finally {
      setPendingId(null)
    }
  }

  async function handleDeleteUser(targetUser) {
    // Guardia de seguridad: un admin no puede borrarse a sí mismo.
    // El backend además protege al último admin (ensureNotLastAdmin).
    if (user?.id === targetUser.id) {
      setUsersError(t('admin.cannotDeleteSelf'))
      setNotice(null)
      return
    }

    const confirmed = window.confirm(`${t('admin.confirmDelete')} ${targetUser.email}?`)
    if (!confirmed) return

    setPendingId(targetUser.id)
    setUsersError(null)
    setNotice(null)
    try {
      await deleteUser(targetUser.id)
      // Borrado lógico: el backend pone active=false, así que lo quitamos
      // de la lista local sin volver a pedir toda la tabla.
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id))
      setNotice(t('admin.userDeleted'))
    } catch (err) {
      if (err.status === 401) {
        clearSession()
        navigate(ROUTES.login, { replace: true })
      } else {
        setUsersError(err.message || t('error.generic'))
      }
    } finally {
      setPendingId(null)
    }
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-arcane-700/60 bg-arcane-900 p-8 text-center shadow-[0_0_60px_rgba(217,70,239,0.15)]">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/30">
          <ShieldCheck size={28} className="text-white" />
        </span>

        <h1 className="text-2xl font-bold text-arcane-100">{t('admin.title')}</h1>

        <div className="mt-4 flex justify-center gap-2">
          <Badge className="border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-300">
            {t('role.label')}: {user.role}
          </Badge>
          <Badge className="border-arcane-700 bg-arcane-800/80 text-arcane-400">{user.email}</Badge>
        </div>

        {checking ? (
          <div className="mt-8 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <p className="mt-8 text-sm text-arcane-400">{message ?? t('error.generic')}</p>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-arcane-700/60 bg-arcane-900 p-6 shadow-[0_0_60px_rgba(217,70,239,0.15)]">
        <h2 className="text-xl font-bold text-arcane-100">{t('admin.usersTitle')}</h2>

        {loadingUsers ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <Spinner />
            <p className="text-sm text-arcane-400">{t('admin.loading')}</p>
          </div>
        ) : usersError ? (
          <p className="mt-4 text-sm text-red-300">{usersError}</p>
        ) : !users || users.length === 0 ? (
          <p className="mt-4 text-center text-sm text-arcane-400">{t('admin.emptyUsers')}</p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-arcane-700/60 text-xs uppercase tracking-wider text-arcane-400">
                    <th className="py-3 pr-4 font-medium">{t('admin.id')}</th>
                    <th className="py-3 pr-4 font-medium">{t('admin.email')}</th>
                    <th className="py-3 pr-4 font-medium">{t('admin.role')}</th>
                    <th className="py-3 pr-4 font-medium">{t('admin.updateRole')}</th>
                    <th className="py-3 font-medium">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isAdmin = u.role === 'ADMIN'
                    const isSelf = user?.id === u.id
                    const isPending = pendingId === u.id
                    return (
                      <tr key={u.id} className="border-b border-arcane-800/80 last:border-0">
                        <td className="py-3 pr-4 font-mono text-xs text-arcane-400">{u.id}</td>
                        <td className="py-3 pr-4 text-arcane-100">{u.email}</td>
                        <td className="py-3 pr-4">
                          <Badge
                            className={
                              isAdmin
                                ? 'border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-300'
                                : 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                            }
                          >
                            {t(`user.role.${u.role}`)}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isPending || isAdmin}
                              onClick={() => handleRoleChange(u, 'ADMIN')}
                              className={`${roleButtonBase} ${isAdmin ? roleButtonActive : roleButtonInactive}`}
                            >
                              {t('user.role.ADMIN')}
                            </button>
                            <button
                              type="button"
                              disabled={isPending || !isAdmin || isSelf}
                              title={isSelf && isAdmin ? t('admin.cannotChangeOwnRole') : undefined}
                              onClick={() => handleRoleChange(u, 'USER')}
                              className={`${roleButtonBase} ${!isAdmin ? roleButtonActive : roleButtonInactive}`}
                            >
                              {t('user.role.USER')}
                            </button>
                            {isPending && <Loader2 size={14} className="animate-spin text-fuchsia-400" />}
                          </div>
                        </td>
                        <td className="py-3">
                          <button
                            type="button"
                            disabled={isPending || isSelf}
                            title={isSelf ? t('admin.cannotDeleteSelf') : undefined}
                            onClick={() => handleDeleteUser(u)}
                            className={deleteButtonBase}
                          >
                            <Trash2 size={14} />
                            {t('admin.deleteUser')}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label={t('admin.prev')}
                  className="rounded-lg border border-arcane-700 bg-arcane-800 px-3 py-1.5 text-sm text-arcane-400 transition hover:text-arcane-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>
                <span aria-label={t('admin.page')} className="text-sm text-arcane-400">
                  {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  aria-label={t('admin.next')}
                  className="rounded-lg border border-arcane-700 bg-arcane-800 px-3 py-1.5 text-sm text-arcane-400 transition hover:text-arcane-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}

        {notice && (
          <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {notice}
          </p>
        )}
      </div>
    </div>
  )
}
