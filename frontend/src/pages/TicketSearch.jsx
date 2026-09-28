import { useDeferredValue, useEffect, useState } from 'react'
import { Download, Search, SlidersHorizontal } from 'lucide-react'
import TicketDetailModal from '../components/analyzer/TicketDetailModal'
import TicketTable from '../components/dashboard/TicketTable'
import { useToast } from '../components/ToastProvider'
import { CATEGORIES } from '../data/categories'
import { searchTickets } from '../services/api'

const PAGE_SIZE = 100

function csvCell(value) {
    let text = String(value ?? '')
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
    return `"${text.replaceAll('"', '""')}"`
}

export default function TicketSearch({ onDelete }) {
    const [query, setQuery] = useState('')
    const deferredQuery = useDeferredValue(query)
    const [category, setCategory] = useState('')
    const [urgency, setUrgency] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [tickets, setTickets] = useState([])
    const [selectedTicket, setSelectedTicket] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [error, setError] = useState('')
    const [hasMore, setHasMore] = useState(false)
    const notify = useToast()

    useEffect(() => {
        let active = true
        const timer = window.setTimeout(() => {
            setLoading(true)
            setError('')
            searchTickets({
                limit: PAGE_SIZE,
                offset: 0,
                ...(deferredQuery.trim() && { search: deferredQuery.trim() }),
                ...(category && { category }),
                ...(urgency && { urgency_level: urgency }),
                ...(startDate && { start_date: startDate }),
                ...(endDate && { end_date: endDate }),
            })
                .then((data) => {
                    if (!active) return
                    setTickets(data)
                    setHasMore(data.length === PAGE_SIZE)
                })
                .catch((fetchError) => { if (active) setError(fetchError.message) })
                .finally(() => { if (active) setLoading(false) })
        }, 180)
        return () => { active = false; window.clearTimeout(timer) }
    }, [deferredQuery, category, urgency, startDate, endDate])

    const filters = {
        ...(deferredQuery.trim() && { search: deferredQuery.trim() }),
        ...(category && { category }),
        ...(urgency && { urgency_level: urgency }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
    }

    async function loadMore() {
        setLoadingMore(true)
        try {
            const nextPage = await searchTickets({ ...filters, limit: PAGE_SIZE, offset: tickets.length })
            setTickets((current) => [...current, ...nextPage])
            setHasMore(nextPage.length === PAGE_SIZE)
        } catch (fetchError) {
            notify(fetchError.message, 'error')
        } finally {
            setLoadingMore(false)
        }
    }

    async function exportCsv() {
        setExporting(true)
        try {
            const allTickets = []
            for (let offset = 0; ; offset += PAGE_SIZE) {
                const page = await searchTickets({ ...filters, limit: PAGE_SIZE, offset })
                allTickets.push(...page)
                if (page.length < PAGE_SIZE) break
            }
            const columns = ['ticket_id', 'text', 'category', 'assigned_team', 'status', 'urgency', 'urgency_level', 'created_at']
            const rows = allTickets.map((ticket) => [ticket.ticketId, ticket.text, ticket.category, ticket.assignedTeam, ticket.status, ticket.urgency, ticket.urgencyLevel, ticket.createdAt])
            const csv = [columns, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
            const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
            const link = document.createElement('a')
            link.href = url
            link.download = `support-tickets-${new Date().toISOString().slice(0, 10)}.csv`
            link.click()
            URL.revokeObjectURL(url)
            notify(`Exported ${allTickets.length} matching ticket${allTickets.length === 1 ? '' : 's'}.`)
        } catch (exportError) {
            notify(exportError.message, 'error')
        } finally {
            setExporting(false)
        }
    }

    async function handleDelete(ticket) {
        try {
            await onDelete(ticket)
            setTickets((current) => current.filter((record) => record.ticketId !== ticket.ticketId))
            notify(`Ticket ${ticket.ticketId} deleted.`)
        } catch (deleteError) {
            notify(deleteError.message, 'error')
            throw deleteError
        }
    }

    function clearFilters() {
        setQuery('')
        setCategory('')
        setUrgency('')
        setStartDate('')
        setEndDate('')
    }

    const invalidDateRange = startDate && endDate && startDate > endDate

    return (
        <div className="page ticket-search-page">
            <div className="page-heading">
                <div><p className="eyebrow">SUPPORT OPERATIONS / RECORDS</p><h1>Ticket Search</h1><p className="page-heading__subtitle">Search and filter persisted tickets across your support history.</p></div>
                <button className="button button--primary" type="button" onClick={exportCsv} disabled={exporting || loading || Boolean(error) || invalidDateRange}>
                    <Download size={16} aria-hidden="true" /> {exporting ? 'Preparing CSV…' : 'Export CSV'}
                </button>
            </div>
            <section className="search-toolbar" aria-label="Ticket search filters">
                <label className="search-field">
                    <span className="sr-only">Search ticket text or ID</span>
                    <Search size={17} aria-hidden="true" />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ticket text…" />
                </label>
                <label className="filter-field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{CATEGORIES.map(({ name }) => <option key={name} value={name}>{name}</option>)}</select></label>
                <label className="filter-field"><span>Urgency</span><select value={urgency} onChange={(event) => setUrgency(event.target.value)}><option value="">Any level</option><option>Low</option><option>Medium</option><option>High</option></select></label>
                <label className="filter-field"><span>From</span><input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} /></label>
                <label className="filter-field"><span>To</span><input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} /></label>
                <button className="icon-button filter-clear" type="button" onClick={clearFilters} aria-label="Clear all filters" title="Clear all filters"><SlidersHorizontal size={17} /></button>
            </section>
            <section className="surface-panel search-results">
                <div className="search-results__heading"><div><p className="eyebrow">PERSISTED HISTORY</p><h2>{loading ? 'Loading tickets…' : `${tickets.length}${hasMore ? '+' : ''} tickets`}</h2></div><span className="snapshot-tag">Newest first</span></div>
                {invalidDateRange ? <div className="empty-state" role="alert"><p>Choose a start date that is on or before the end date.</p></div> : loading ? <div className="empty-state" role="status"><p>Searching ticket history…</p></div> : error ? <div className="empty-state" role="alert"><p>{error}</p></div> : tickets.length ? <TicketTable records={tickets} onSelect={setSelectedTicket} /> : <div className="empty-state"><p>No tickets match these filters.</p></div>}
                {hasMore && !loading && !error && !invalidDateRange && <div className="search-results__more"><button className="button button--quiet" type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more tickets'}</button></div>}
            </section>
            {selectedTicket && <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onDelete={handleDelete} />}
        </div>
    )
}