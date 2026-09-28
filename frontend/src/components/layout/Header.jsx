import { ArrowUpRight, Menu, Moon, Sun } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const PAGE_LABELS = {
  '/': 'Overview',
  '/analyze': 'Ticket Analyzer',
  '/tickets': 'Ticket Search',
  '/pipeline': 'NLP Pipeline',
  '/model': 'Model Information',
}

export default function Header({ status, menuOpen, onMenuClick, theme, onThemeToggle }) {
  const { pathname } = useLocation()
  const pageLabel = PAGE_LABELS[pathname] || 'Overview'

  return (
    <header className="topbar">
      <button
        className="icon-button topbar__menu"
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        aria-controls="primary-navigation"
        aria-expanded={menuOpen}
      >
        <Menu size={20} />
      </button>
      <div className="topbar__crumbs" aria-label="Current page">
        <span>Support Ops</span>
        <span className="topbar__separator" aria-hidden="true">/</span>
        <strong>{pageLabel}</strong>
      </div>
      <div className="topbar__right">
        <button className="icon-button theme-toggle" type="button" onClick={onThemeToggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <span className={`topbar__status topbar__status--${status}`}>
          <span className="backend-status__dot" />
          {status === 'connected' ? 'API online' : status === 'checking' ? 'Checking' : 'API offline'}
        </span>
        <Link to="/analyze" className="topbar__action">
          New analysis <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </header>
  )
}
