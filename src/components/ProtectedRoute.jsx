import React, { useState } from 'react'
import Login from '../pages/Login' // Adjust path as needed
import Sidebar from './Sidebar'

const ProtectedRoute = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  // If not logged in, show only the login page
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  // If logged in, show the protected content with sidebar
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

export default ProtectedRoute