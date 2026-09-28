import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

export default function AppLayout({ status }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('support-ops-theme') === 'dark' ? 'dark' : 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('support-ops-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!menuOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  return (
    <div className="app-shell">
      <Sidebar status={status} isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="app-main">
        <Header status={status} menuOpen={menuOpen} onMenuClick={() => setMenuOpen(true)} theme={theme} onThemeToggle={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} />
        <main className="main-content" id="main-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Support Ticket Triage</span>
          <span>Explainable NLP · Operator review required</span>
        </footer>
      </div>
    </div>
  )
}
