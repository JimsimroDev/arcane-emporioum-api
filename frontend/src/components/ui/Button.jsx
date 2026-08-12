const VARIANTS = {
  primary:
    'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/25 hover:brightness-110',
  secondary: 'border border-arcane-700 bg-transparent text-arcane-100 hover:bg-arcane-800',
  ghost: 'text-arcane-400 hover:text-arcane-100 hover:bg-arcane-800/60',
}

export function Button({ as: Component = 'button', variant = 'primary', className = '', ...props }) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
    'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/70',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant] ?? VARIANTS.primary,
    className,
  ].join(' ')

  return <Component className={classes} {...props} />
}
