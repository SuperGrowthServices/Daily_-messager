import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
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
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/campaigns/create" element={<CreateCampaign />} />
            <Route path="/users" element={<Users />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/staged" element={<Staged />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App 