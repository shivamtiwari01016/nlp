import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, BarChart3, Layers3, Ticket } from 'lucide-react'
import CategoryChart from '../components/dashboard/CategoryChart'
import RecentTickets from '../components/dashboard/RecentTickets'
import StatCard from '../components/dashboard/StatCard'
import { CATEGORIES } from '../data/categories'
import { getMetrics, getStatistics } from '../services/api'

export default function Dashboard({ history, historyLoading, historyError }) {
  const [statistics, setStatistics] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [statisticsLoading, setStatisticsLoading] = useState(true)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [statisticsError, setStatisticsError] = useState('')
  const [metricsError, setMetricsError] = useState('')

  useEffect(() => {
    let isMounted = true
    getStatistics()
      .then((data) => { if (isMounted) setStatistics(data) })
      .catch((error) => { if (isMounted) setStatisticsError(error.message) })
      .finally(() => { if (isMounted) setStatisticsLoading(false) })
    getMetrics()
      .then((data) => { if (isMounted) setMetrics(data) })
      .catch((error) => { if (isMounted) setMetricsError(error.message) })
      .finally(() => { if (isMounted) setMetricsLoading(false) })

    return () => { isMounted = false }
  }, [])

  const categoryData = CATEGORIES
    .map(({ name, color }) => ({
      category: name,
      count: statistics?.categoryDistribution[name] || 0,
      color,
    }))
    .filter((entry) => entry.count > 0)
  const averageUrgency = statistics
    ? `${Math.round(statistics.averageUrgency * 100)}%`
    : statisticsLoading ? '—' : '0%'
  const accuracy = metrics ? `${(metrics.accuracy * 100).toFixed(1)}%` : metricsLoading ? '—' : 'Unavailable'
  const belowBaseline = metrics && metrics.accuracy < metrics.majority_baseline_accuracy

  return (
    <div className="page dashboard-page">
      <div className="page-heading page-heading--dashboard">
        <div>
          <p className="eyebrow">SUPPORT OPERATIONS / OVERVIEW</p>
          <h1>Support Ticket Triage</h1>
          <p className="page-heading__subtitle">Automatically classify support tickets and estimate urgency using an explainable NLP pipeline.</p>
        </div>
        <div className="dashboard-page__date">
          <span className="status-pulse" />
          MySQL runtime data · {history.length} recent shown
        </div>
      </div>

      <section className="stats-grid" aria-label="Support triage summary">
        <StatCard icon={Ticket} label="Total Tickets" value={statistics?.totalTickets ?? (statisticsLoading ? '—' : '0')} detail="Persisted runtime tickets" tone="teal" />
        <StatCard icon={Layers3} label="Categories" value={CATEGORIES.length} detail="Classifier label set" tone="blue" />
        <StatCard icon={Activity} label="Average Urgency" value={averageUrgency} detail={statistics ? 'Across saved predictions' : statisticsLoading ? 'Loading database statistics' : 'No saved predictions'} tone="amber" />
        <StatCard icon={BarChart3} label="Model Accuracy" value={accuracy} detail={metrics ? `${(metrics.majority_baseline_accuracy * 100).toFixed(1)}% majority baseline` : 'Training evaluation endpoint'} tone="coral" />
      </section>

      {(statisticsError || metricsError) && (
        <div className="dashboard-alert" role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          <p>{statisticsError || metricsError}</p>
        </div>
      )}
      {belowBaseline && (
        <div className="dashboard-alert" role="note">
          <AlertTriangle size={17} aria-hidden="true" />
          <p><strong>Evaluation caveat.</strong> The measured text model is below its majority baseline; verify category predictions before routing.</p>
        </div>
      )}

      <section className="overview-grid">
        <article className="surface-panel category-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PERSISTED TICKETS</p>
              <h2>Predicted category distribution</h2>
            </div>
            <span className="snapshot-tag">Live · MySQL</span>
          </div>
          <p className="panel-caption">Category counts are calculated from stored prediction records; no Kaggle training rows are imported.</p>
          {statisticsLoading ? (
            <div className="empty-state"><p>Loading database statistics…</p></div>
          ) : categoryData.length ? (
            <CategoryChart data={categoryData} />
          ) : (
            <div className="empty-state"><p>No ticket predictions yet.</p></div>
          )}
        </article>
        <article className="surface-panel operator-note">
          <p className="eyebrow">TRIAGE WORKFLOW</p>
          <div className="operator-note__mark">01<span> / 03</span></div>
          <h2>Read the signal. Verify the route.</h2>
          <p>The model combines TF-IDF features with Logistic Regression. Urgency comes from sentiment and should guide review, not replace an operator’s judgment.</p>
          <div className="operator-note__footer">
            <span className="operator-note__line" />
            <span>Explainable baseline · operator review</span>
          </div>
        </article>
      </section>

      <RecentTickets records={history} loading={historyLoading} error={historyError} />
    </div>
  )
}
