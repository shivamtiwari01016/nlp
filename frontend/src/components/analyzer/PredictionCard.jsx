import { Check } from 'lucide-react'
import CategoryBadge from './CategoryBadge'
import UrgencyMeter from './UrgencyMeter'

export default function PredictionCard({ prediction }) {
  return (
    <section className="prediction-card" aria-live="polite" aria-label="Prediction result">
      <div className="prediction-card__heading">
        <span className="prediction-card__check"><Check size={16} aria-hidden="true" /></span>
        <div>
          <p className="eyebrow">Prediction result</p>
          <h2>Ticket analyzed</h2>
        </div>
        <span className="prediction-card__source">FastAPI response</span>
      </div>
      <div className="prediction-card__category">
        <span className="result-label">Category</span>
        <CategoryBadge category={prediction.category} />
      </div>
      <div className="prediction-card__category">
        <span className="result-label">Assigned team</span>
        <strong>{prediction.assignedTeam}</strong>
      </div>
      <div className="prediction-card__urgency">
        <div className="result-label-row">
          <span className="result-label">Urgency estimate</span>
          <span className="result-label__detail">Normalized score</span>
        </div>
        <UrgencyMeter score={prediction.score} />
      </div>
      <div className="prediction-card__footnote">
        The category is returned by the trained text classifier. Urgency is returned by the sentiment scoring service.
      </div>
    </section>
  )
}
