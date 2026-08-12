export function Spinner({ className = '' }) {
  return (
    <span
      role="status"
      aria-label="loading"
      className={`inline-block h-8 w-8 animate-spin rounded-full border-2 border-arcane-700 border-t-fuchsia-500 ${className}`}
    />
  )
}
