import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Plus,
  Users,
  FileText,
  Settings,
  Clock,
  History,
  LogOut
} from 'lucide-react'

const Sidebar = ({ onLogout }) => {
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Create Campaign', href: '/campaigns/create', icon: Plus },
    { name: 'Staged Messages', href: '/staged', icon: Clock },
    { name: 'Message History', href: '/history', icon: History },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Templates', href: '/templates', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings }
  ]

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <span className="text-xl font-bold text-gray-900">WhatsApp Manager</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer with Logout */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
        <div className="text-xs text-gray-500 text-center">
          Daily Message App
        </div>
      </div>
    </div>
  )
}

export default Sidebar