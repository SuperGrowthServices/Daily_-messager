import React, { useState, useEffect } from 'react'
import { 
  Clock, 
  Search, 
  Filter,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader
} from 'lucide-react'
import { getMessageLogs } from '../lib/scheduler'

const History = () => {
  const [messageLogs, setMessageLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [campaignFilter, setCampaignFilter] = useState('all')

  useEffect(() => {
    loadMessageLogs()
  }, [])

  const loadMessageLogs = async () => {
    setIsLoading(true)
    try {
      const logs = await getMessageLogs(100) // Load last 100 messages
      setMessageLogs(logs)
    } catch (error) {
      console.error('Error loading message logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatSentTime = (sentTime) => {
    const date = new Date(sentTime)
    return date.toLocaleString('en-US', {
      timeZone: 'Asia/Dubai',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'read':
        return <CheckCircle className="w-4 h-4 text-purple-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800'
      case 'delivered':
        return 'bg-blue-100 text-blue-800'
      case 'read':
        return 'bg-purple-100 text-purple-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Filter logs based on search and filters
  const filteredLogs = messageLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recipient_phone?.includes(searchTerm) ||
      log.message_content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || log.status === statusFilter
    const matchesCampaign = campaignFilter === 'all' || log.campaign_id === campaignFilter

    return matchesSearch && matchesStatus && matchesCampaign
  })

  // Get unique campaigns for filter
  const uniqueCampaigns = [...new Set(messageLogs.map(log => log.campaign_id))]
    .filter(id => id) // Remove null/undefined

  // Get campaign names for display
  const campaignNames = {}
  messageLogs.forEach(log => {
    if (log.campaign_id && log.campaign_name) {
      campaignNames[log.campaign_id] = log.campaign_name
    }
  })

  // Statistics
  const totalMessages = messageLogs.length
  const sentMessages = messageLogs.filter(log => log.status === 'sent').length
  const deliveredMessages = messageLogs.filter(log => log.status === 'delivered').length
  const readMessages = messageLogs.filter(log => log.status === 'read').length
  const failedMessages = messageLogs.filter(log => log.status === 'failed').length

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin mr-3" />
          <span className="text-lg">Loading message history...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Message History</h1>
          <p className="text-gray-600 mt-2">
            Complete log of sent messages
            <span className="text-sm text-blue-600 ml-2">(All times in Dubai timezone)</span>
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadMessageLogs}
            className="btn-secondary"
            disabled={isLoading}
          >
            Refresh
          </button>
          <button
            onClick={() => {
              // Export functionality could be added here
              alert('Export functionality coming soon!')
            }}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{totalMessages}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sent</p>
              <p className="text-2xl font-bold text-gray-900">{sentMessages}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">{deliveredMessages}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Read</p>
              <p className="text-2xl font-bold text-gray-900">{readMessages}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">{failedMessages}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by recipient, message, or campaign..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="read">Read</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Campaigns</option>
              {uniqueCampaigns.map(campaignId => (
                <option key={campaignId} value={campaignId}>
                  {campaignNames[campaignId] || `Campaign ${campaignId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Message Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Message Logs ({filteredLogs.length} results)
          </h2>
        </div>

        <div className="p-6">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages Found</h3>
              <p className="text-gray-500">
                {messageLogs.length === 0 
                  ? 'No messages have been sent yet.'
                  : 'No messages match your current filters.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(log.status)}
                        <span className="font-medium text-gray-900">
                          {log.user_name} ({log.recipient_phone})
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                        {log.campaign_name && (
                          <span className="text-sm text-gray-500">
                            Campaign: {log.campaign_name}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Sent:</span> {formatSentTime(log.sent_time)}
                      </div>
                      
                      {log.message_content && (
                        <div className="bg-gray-50 rounded p-3 text-sm">
                          <span className="font-medium">Message:</span>
                          <p className="mt-1 text-gray-700">{log.message_content}</p>
                        </div>
                      )}
                      
                      {log.error_message && (
                        <div className="bg-red-50 rounded p-3 text-sm mt-2">
                          <span className="font-medium text-red-800">Error:</span>
                          <p className="mt-1 text-red-700">{log.error_message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default History 