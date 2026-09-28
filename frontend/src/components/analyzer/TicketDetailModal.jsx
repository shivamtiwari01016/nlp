import { useEffect, useState } from 'react'
import { CalendarClock, CircleAlert, Download, Trash2, X } from 'lucide-react'
import CategoryBadge from './CategoryBadge'
import { getUrgencyPresentation } from '../../utils/urgency'

function formatDate(value) {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
        ? 'Time unavailable'
        : new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(date)
}

export default function TicketDetailModal({ ticket, onClose, onDelete }) {
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const urgency = getUrgencyPresentation(ticket.urgency)

    useEffect(() => {
        const closeOnEscape = (event) => {
            if (event.key === 'Escape' && !deleting) onClose()
        }
        window.addEventListener('keydown', closeOnEscape)
        return () => window.removeEventListener('keydown', closeOnEscape)
    }, [deleting, onClose])

    async function handleDelete() {
        if (!confirmDelete) {
            setConfirmDelete(true)
            return
        }
        setDeleting(true)
        try {
            await onDelete(ticket)
            onClose()
        } catch {
            setDeleting(false)
        }
    }

    function exportOne() {
        const columns = ['ticket_id', 'text', 'category', 'assigned_team', 'status', 'urgency', 'urgency_level', 'created_at']
        const values = [ticket.ticketId, ticket.text, ticket.category, ticket.assignedTeam, ticket.status, ticket.urgency, ticket.urgencyLevel, ticket.createdAt]
        const csvCell = (value) => {
            let text = String(value ?? '')
            if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
            return `"${text.replaceAll('"', '""')}"`
        }
        const csv = [columns, values].map((row) => row.map(csvCell).join(',')).join('\r\n')
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
        const link = document.createElement('a')
        link.href = url
        link.download = `${ticket.ticketId}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
            <section className="ticket-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-modal-title">
                <header className="ticket-modal__header">
                    <div><p className="eyebrow">TICKET RECORD</p><h2 id="ticket-modal-title">{ticket.ticketId}</h2></div>
                    <button className="icon-button" type="button" onClick={onClose} aria-label="Close ticket details"><X size={19} /></button>
                </header>
                <div className="ticket-modal__body">
                    <div className="ticket-modal__badges"><CategoryBadge category={ticket.category} /><span className={`urgency-level urgency-level--${urgency.tone}`}>{ticket.urgencyLevel || urgency.level} urgency</span></div>
                    <p className="ticket-modal__text">{ticket.text}</p>
                    <dl className="ticket-modal__details">
                        <div><dt>Assigned team</dt><dd>{ticket.assignedTeam}</dd></div>
                        <div><dt>Status</dt><dd>{ticket.status.replaceAll('_', ' ')}</dd></div>
                        <div><dt>Urgency score</dt><dd><CircleAlert size={15} aria-hidden="true" /> {urgency.percentage ?? '—'}%</dd></div>
                        <div><dt>Created</dt><dd><CalendarClock size={15} aria-hidden="true" /> {formatDate(ticket.createdAt)}</dd></div>
                    </dl>
                </div>
                <footer className="ticket-modal__actions">
                    {confirmDelete && <span className="ticket-modal__confirm">Delete this ticket permanently?</span>}
                    <button className="button button--quiet" type="button" onClick={exportOne}><Download size={15} /> Export record</button>
                    <button className="button button--danger" type="button" onClick={handleDelete} disabled={deleting}>
                        <Trash2 size={15} /> {deleting ? 'Deleting…' : confirmDelete ? 'Confirm delete' : 'Delete ticket'}
                    </button>
                </footer>
            </section>
        </div>
    )
}