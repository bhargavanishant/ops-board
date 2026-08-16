import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import './index.css'
import Login from './pages/login/Login.tsx'
import AppShell from './pages/appshell/AppShell.tsx'
import Incidents from './pages/incidents/Incidents.tsx'
import Overview from './pages/overview/Overview.tsx'
import Services from './pages/services/Services.tsx'
import Settings from './pages/settings/Settings.tsx'
import { applyTheme, getStoredTheme } from './theme/theme.ts'

applyTheme(getStoredTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route element={<AppShell />}>   
          <Route path="/overview" element={<Overview />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/services" element={<Services />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
