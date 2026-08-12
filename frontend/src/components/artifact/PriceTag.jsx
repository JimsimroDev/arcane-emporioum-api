export function PriceTag({ formatted, price, className = '' }) {
  const display = formatted ?? price ?? '—'
  return <span className={className}>{display}</span>
}
