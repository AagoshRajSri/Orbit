import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import './index.css'
import FaceLock from './components/FaceLock'
import AmbientPresence from './components/AmbientPresence'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
        {/* Top nav */}
        <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase" style={{ color: 'var(--muted)' }}>
            Orbit Auth
          </span>
          <div className="flex gap-1 p-1 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {[
              { to: '/',         label: 'Face Lock' },
              { to: '/ambient',  label: 'Ambient Presence' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-md font-mono text-[10px] tracking-widest uppercase transition-all duration-200 ` +
                  (isActive
                    ? 'text-[var(--accent)] border'
                    : 'text-[var(--muted)] border border-transparent hover:text-[var(--text)]')
                }
                style={({ isActive }) => isActive ? {
                  background: 'rgba(61,143,245,0.09)',
                  borderColor: 'rgba(61,143,245,0.3)',
                } : {}}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        <main className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <Routes>
            <Route path="/"        element={<FaceLock />} />
            <Route path="/ambient" element={<AmbientPresence />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
