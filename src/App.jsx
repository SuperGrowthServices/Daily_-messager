import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import CreateCampaign from './pages/CreateCampaign'
import Users from './pages/Users'
import Templates from './pages/Templates'
import Settings from './pages/Settings'
import Staged from './pages/Staged'
import History from './pages/History'

function App() {
  return (
    <Router>
      <ProtectedRoute>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/campaigns/create" element={<CreateCampaign />} />
          <Route path="/users" element={<Users />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/staged" element={<Staged />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </ProtectedRoute>
    </Router>
  )
}

export default App