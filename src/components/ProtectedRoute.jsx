import React, { useState, useEffect } from 'react'
import Login from '../pages/Login'
import Sidebar from './Sidebar'

const ProtectedRoute = ({ children }) => {
  // Initialize state from sessionStorage
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('isLoggedIn') === 'true'
  })

  // Update sessionStorage whenever login state changes
  useEffect(() => {
    sessionStorage.setItem('isLoggedIn', isLoggedIn.toString())
  }, [isLoggedIn])

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    sessionStorage.removeItem('isLoggedIn') // Clean up on logout
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

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