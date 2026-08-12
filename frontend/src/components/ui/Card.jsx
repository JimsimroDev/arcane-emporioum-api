export function Card({ className = '', ...props }) {
  return (
    <div
      className={`rounded-2xl border border-arcane-700/60 bg-arcane-900 shadow-[0_0_30px_rgba(217,70,239,0.15)] ${className}`}
      {...props}
    />
  )
}
