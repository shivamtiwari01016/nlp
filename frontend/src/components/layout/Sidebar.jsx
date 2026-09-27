import { Activity, Cpu, LayoutDashboard, ScanText, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const NAVIGATION = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/analyze', label: 'Ticket Analyzer', icon: ScanText },
  { to: '/pipeline', label: 'NLP Pipeline', icon: Activity },
  { to: '/model', label: 'Model Information', icon: Cpu },
]

export default function Sidebar({ status, isOpen, onClose }) {
  return (
    <>
      <div className={`sidebar-scrim${isOpen ? ' sidebar-scrim--visible' : ''}`} onClick={onClose} />
      <aside id="primary-navigation" className={`sidebar${isOpen ? ' sidebar--open' : ''}`} aria-label="Primary navigation">
        <div className="sidebar__topline">
          <NavLink to="/" className="brand" aria-label="Support Ticket Triage home" onClick={onClose}>
            <span className="brand__mark" aria-hidden="true">ST</span>
            <span className="brand__text">
              <strong>Support Ops</strong>
              <small>Ticket triage</small>
            </span>
          </NavLink>
          <button className="icon-button sidebar__close" type="button" onClick={onClose} aria-label="Close navigation">
            <X size={19} />
          </button>
        </div>
        <div className="sidebar__section-label">WORKSPACE</div>
        <nav className="sidebar__nav">
          {NAVIGATION.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
            >
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__bottom">
          <div className="sidebar__section-label">SYSTEM STATUS</div>
          <div className={`backend-status backend-status--${status}`} role="status">
            <span className="backend-status__dot" />
            <span>{status === 'connected' ? 'Backend connected' : status === 'checking' ? 'Checking backend' : 'Backend unavailable'}</span>
          </div>
          <p className="sidebar__version">Explainable NLP · Local model</p>
        </div>
      </aside>
    </>
  )
}
