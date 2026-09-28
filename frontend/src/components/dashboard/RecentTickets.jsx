import { useState } from 'react'
import { ArrowUpRight, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import TicketDetailModal from '../analyzer/TicketDetailModal'
import TicketTable from './TicketTable'

export default function RecentTickets({ records = [], compact = false, loading = false, error = '', onDelete }) {
  const [selectedTicket, setSelectedTicket] = useState(null)
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
        <TicketTable records={records} onSelect={setSelectedTicket} />
      )}
      {selectedTicket && <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onDelete={onDelete} />}
    </section>
  )
}
