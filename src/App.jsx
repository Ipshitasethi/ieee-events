import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AdminLayout from './layouts/AdminLayout'
import PublicLayout from './layouts/PublicLayout'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import EventsList from './pages/admin/EventsList'
import EventDetail from './pages/admin/EventDetail'
import TeamManagement from './pages/admin/TeamManagement'
import ParticipantForm from './pages/public/ParticipantForm'
import CertificatePreview from './pages/public/CertificatePreview'
import RetrieveCertificate from './pages/public/RetrieveCertificate'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen w-full">
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="events" element={<EventsList />} />
            <Route path="events/new" element={<Navigate to="/admin/events" />} />
            <Route path="events/:id" element={<EventDetail />} />
            <Route path="team" element={<TeamManagement />} />
          </Route>
          
          <Route element={<PublicLayout />}>
            <Route path="/event/:id" element={<ParticipantForm />} />
            <Route path="/event/:id/certificate/:pid" element={<CertificatePreview />} />
            <Route path="/retrieve" element={<RetrieveCertificate />} />
          </Route>
        </Routes>
      </div>
      <Toaster position="bottom-right" 
        toastOptions={{
          style: {
            background: '#0E1420',
            color: '#fff',
            border: '1px solid rgba(0, 212, 255, 0.15)',
          }
        }} 
      />
    </BrowserRouter>
  )
}
