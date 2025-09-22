import { Router } from '@/router'
import { AuthProvider } from '@/contexts/AuthContext'
import { DashboardProvider } from '@/contexts/DashboardContext'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <DashboardProvider>
        <Router />
      </DashboardProvider>
    </AuthProvider>
  )
}

export default App
