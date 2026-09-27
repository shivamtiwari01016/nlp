import { getUrgencyPresentation } from '../../utils/urgency'

export default function UrgencyMeter({ score, compact = false }) {
  const urgency = getUrgencyPresentation(score)
  const markerPosition = urgency.score === null ? 0 : urgency.score * 100

  return (
    <section className={`urgency-meter urgency-meter--${urgency.tone}${compact ? ' urgency-meter--compact' : ''}`} aria-label="Ticket urgency">
      <div className="urgency-meter__reading">
        <span className="urgency-meter__value">
          {urgency.percentage === null ? '—' : `${urgency.percentage}%`}
        </span>
        <span className={`urgency-level urgency-level--${urgency.tone}`}>{urgency.level}</span>
      </div>
      <div
        className="urgency-meter__track"
        role="meter"
        aria-label="Urgency score"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={urgency.percentage ?? undefined}
        aria-valuetext={
          urgency.percentage === null
            ? 'Urgency unavailable'
            : `${urgency.percentage}% ${urgency.level} urgency`
        }
      >
        <span className="urgency-meter__segment urgency-meter__segment--low" />
        <span className="urgency-meter__segment urgency-meter__segment--medium" />
        <span className="urgency-meter__segment urgency-meter__segment--high" />
        {urgency.score !== null && (
          <span className="urgency-meter__marker" style={{ left: `${markerPosition}%` }}>
            <span className="urgency-meter__marker-label">{urgency.percentage}%</span>
          </span>
        )}
      </div>
      {!compact && (
        <div className="urgency-meter__scale" aria-hidden="true">
          <span>Low <small>0</small></span>
          <span>Medium <small>0.5</small></span>
          <span>High <small>1</small></span>
        </div>
      )}
      <p className="urgency-meter__note">Sentiment-derived estimate, not an SLA or response-time guarantee.</p>
    </section>
  )
}
