import { FlaskConical, Landmark, ScrollText, Shield, Sword } from 'lucide-react'

export const ROUTES = {
  catalog: '/',
  login: '/login',
  register: '/register',
  admin: '/admin',
  user: '/user',
  favorites: '/favorites',
  checkout: '/checkout',
}

export const AUTH_STORAGE_KEY = 'arcane_user'

export const RARITY_VARIANTS = {
  COMMON: {
    gradient: 'from-slate-500 to-zinc-700',
    badge: 'border-slate-500/40 bg-slate-500/15 text-slate-300',
    dot: 'bg-slate-400',
    text: 'text-slate-300',
  },
  RARE: {
    gradient: 'from-sky-500 to-indigo-700',
    badge: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
    dot: 'bg-sky-400',
    text: 'text-sky-300',
  },
  EPIC: {
    gradient: 'from-fuchsia-500 to-purple-700',
    badge: 'border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-300',
    dot: 'bg-fuchsia-400',
    text: 'text-fuchsia-300',
  },
  LEGENDARY: {
    gradient: 'from-amber-400 to-orange-700',
    badge: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
  },
}

export const CATEGORY_META = {
  WEAPON: { Icon: Sword, color: 'text-rose-300' },
  SCROLL: { Icon: ScrollText, color: 'text-amber-300' },
  RELIC: { Icon: Landmark, color: 'text-violet-300' },
  ARMOR: { Icon: Shield, color: 'text-sky-300' },
  POTION: { Icon: FlaskConical, color: 'text-emerald-300' },
}
