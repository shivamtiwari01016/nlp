import { ArrowUpRight, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import CategoryBadge from '../analyzer/CategoryBadge'
import { getUrgencyPresentation } from '../../utils/urgency'

function formatTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Time unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function RecentTickets({ records = [], compact = false, loading = false, error = '' }) {
  return (
    <section className={`recent-tickets${compact ? ' recent-tickets--compact' : ''}`}>
      <div className="section-heading section-heading--inline">
        <div>
          <p className="eyebrow">MYSQL · LATEST 10 PERSISTED TICKETS</p>
          <h2>Recent tickets</h2>
        </div>
        <Link to="/analyze" className="inline-link">
          Analyze ticket <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>
      {loading ? (
        <div className="empty-state empty-state--compact" role="status"><p>Loading saved tickets…</p></div>
      ) : error ? (
        <div className="empty-state empty-state--compact" role="alert"><p>{error}</p></div>
      ) : records.length === 0 ? (
        <div className="empty-state empty-state--compact">
          <Clock3 size={21} aria-hidden="true" />
          <p>Your recent tickets will appear here.</p>
          <Link to="/analyze">Analyze a ticket</Link>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="ticket-table">
            <thead>
              <tr><th scope="col">Ticket</th><th scope="col">Category</th><th scope="col">Assigned team</th><th scope="col">Status</th><th scope="col">Urgency</th><th scope="col">Created</th></tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const urgency = getUrgencyPresentation(record.urgency)
                return (
                  <tr key={record.ticketId || record.id}>
                    <td className="ticket-table__text" title={`${record.ticketId || record.id} · ${record.text}`}>
                      <span>{record.text}</span><small className="ticket-table__id">{record.ticketId || record.id}</small>
                    </td>
                    <td><CategoryBadge category={record.category} /></td>
                    <td>{record.assignedTeam}</td>
                    <td><span className="snapshot-tag">{record.status.replaceAll('_', ' ')}</span></td>
                    <td><span className={`table-urgency table-urgency--${urgency.tone}`}><i />{urgency.percentage ?? '—'}% <span>{record.urgencyLevel || urgency.level}</span></span></td>
                    <td className="ticket-table__time">{formatTime(record.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
