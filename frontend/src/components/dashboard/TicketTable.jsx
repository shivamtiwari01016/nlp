import { Eye } from 'lucide-react'
import CategoryBadge from '../analyzer/CategoryBadge'
import { getUrgencyPresentation } from '../../utils/urgency'

function formatTime(value) {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
        ? 'Time unavailable'
        : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function TicketTable({ records, onSelect }) {
    return (
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
                                <td className="ticket-table__text">
                                    <button className="ticket-table__open" type="button" onClick={() => onSelect(record)} title="View ticket details">
                                        <span>{record.text}</span><Eye size={14} aria-hidden="true" />
                                    </button>
                                    <small className="ticket-table__id">{record.ticketId || record.id}</small>
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
    )
}