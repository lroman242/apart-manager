import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import ApartmentsPage from './pages/ApartmentsPage'
import TariffsPage from './pages/TariffsPage'

function AuthGuard({ session, children }) {
  if (session === undefined) {
    // Still loading session — render nothing to avoid flash
    return null
  }
  if (!session) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <AuthGuard session={session}>
            <ApartmentsPage />
          </AuthGuard>
        }
      />
      <Route
        path="/apartments/:id/tariffs"
        element={
          <AuthGuard session={session}>
            <TariffsPage />
          </AuthGuard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
