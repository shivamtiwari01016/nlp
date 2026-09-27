import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

export default function AppLayout({ status }) {
  const [menuOpen, setMenuOpen] = useState(false)

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
        <Header status={status} menuOpen={menuOpen} onMenuClick={() => setMenuOpen(true)} />
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
