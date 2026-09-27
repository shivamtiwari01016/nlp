export default function StatCard({ icon: Icon, label, value, detail, tone = 'teal' }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__top">
        <span className="stat-card__icon"><Icon size={18} strokeWidth={1.8} aria-hidden="true" /></span>
        <span className="stat-card__label">{label}</span>
      </div>
      <strong className="stat-card__value">{value}</strong>
      <span className="stat-card__detail">{detail}</span>
    </article>
  )
}
