import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, 
  Layers, 
  Plus, 
  Trash2,
  Users,
  MessageSquare,
  TrendingUp,
  Loader,
  Play
} from 'lucide-react'
import { getActiveCampaigns, getDashboardStats, deleteCampaign } from '../lib/campaigns'
import { scheduleCampaignMessages, processScheduledMessages } from '../lib/scheduler'
import { getTemplateGroups } from '../lib/templates'
import { getUsers } from '../lib/users'

const Dashboard = () => {
  const [activeCampaigns, setActiveCampaigns] = useState([])
  const [templateGroups, setTemplateGroups] = useState([])
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalMessagesSent: 0,
    totalUsers: 0,
    totalTemplateGroups: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Load all data in parallel
      const [campaignsData, groupsData, statsData] = await Promise.all([
        getActiveCampaigns(),
        getTemplateGroups(),
        getDashboardStats()
      ])

      setActiveCampaigns(campaignsData)
      setTemplateGroups(groupsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (campaignId) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    setIsDeleting(true)
    try {
      const result = await deleteCampaign(campaignId)
      if (result.success) {
        // Reload dashboard data
        await loadDashboardData()
        alert('Campaign deleted successfully!')
      } else {
        alert('Error deleting campaign: ' + result.error)
      }
    } catch (error) {
      alert('Error deleting campaign: ' + error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSchedule = async (campaignId) => {
    if (!confirm('Are you sure you want to schedule this campaign? Messages will be sent according to the schedule.')) return

    setIsScheduling(true)
    try {
      const result = await scheduleCampaignMessages(campaignId)
      if (result.success) {
        alert(`Campaign scheduled successfully! ${result.messageCount} messages will be sent.`)
        // Reload dashboard data
        await loadDashboardData()
      } else {
        alert('Error scheduling campaign: ' + result.error)
      }
    } catch (error) {
      alert('Error scheduling campaign: ' + error.message)
    } finally {
      setIsScheduling(false)
    }
  }

  const handleProcessMessages = async () => {
    if (!confirm('This will attempt to send all due messages now. Continue?')) return
    
    setIsProcessing(true)
    try {
      const result = await processScheduledMessages()
      alert(`Processed ${result.processedCount} messages. ${result.sentCount} sent, ${result.failedCount} failed.`)
      await loadDashboardData() // Reload to show updated stats
    } catch (error) {
      alert('Error processing messages: ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const statsCards = [
    {
      title: 'Total Campaigns',
      value: stats.totalCampaigns,
      icon: TrendingUp,
      color: 'bg-green-500',
      description: 'All campaigns in system'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      description: 'Registered users in system'
    },
    {
      title: 'Messages Sent',
      value: stats.totalMessagesSent,
      icon: MessageSquare,
      color: 'bg-purple-500',
      description: 'Total messages delivered'
    },
    {
      title: 'Template Groups',
      value: stats.totalTemplateGroups,
      icon: Layers,
      color: 'bg-orange-500',
      description: 'Available message templates'
    }
  ]

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin mr-3" />
          <span className="text-lg">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your WhatsApp messaging campaigns</p>
        </div>
        <div className="flex space-x-2">
          <Link
            to="/campaigns/create"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </Link>
          <button
            onClick={handleProcessMessages}
            disabled={isProcessing}
            className="btn-primary flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>{isProcessing ? 'Processing...' : 'Process Messages'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                  <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
            </div>
          )
        })}
      </div>

      {/* Template Groups Overview */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Layers className="w-5 h-5 mr-2" />
            Template Groups Overview
          </h2>
        </div>
        <div className="p-6">
          {templateGroups.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No template groups found</p>
              <Link
                to="/templates"
                className="btn-primary mt-4 inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Template Group</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templateGroups.slice(0, 6).map((group) => (
                <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full bg-${group.color}-500`}></div>
                      <h3 className="font-medium text-gray-900">{group.name}</h3>
                    </div>
                    <span className="text-sm text-gray-500">{group.message_count} templates</span>
                  </div>
                  {group.description && (
                    <p className="text-sm text-gray-600">{group.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All Campaigns */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Campaigns</h2>
        </div>
        <div className="p-6">
          {activeCampaigns.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No campaigns found</p>
              <Link
                to="/campaigns/create"
                className="btn-primary inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Campaign</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeCampaigns.map((campaign) => (
                <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                      {campaign.description && (
                        <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Template Group:</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className={`w-2 h-2 rounded-full bg-${campaign.template_group_color}-500`}></div>
                            <span className="font-medium">{campaign.template_group_name}</span>
                            <span className="text-gray-500">({campaign.template_count} templates)</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Audience:</span>
                          <p className="font-medium">{campaign.user_type_filter === 'all' ? 'All Users' : campaign.user_type_filter}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Messages Sent:</span>
                          <p className="font-medium">{campaign.messages_sent || 0}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Schedule:</span>
                          <p className="font-medium capitalize">{campaign.schedule_type}</p>
                        </div>
                      </div>
                      
                      {campaign.status === 'draft' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleSchedule(campaign.id)}
                            disabled={isScheduling}
                            className="btn-primary flex items-center space-x-2"
                          >
                            <Play className="w-4 h-4" />
                            <span>{isScheduling ? 'Scheduling...' : 'Schedule Now'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

export default Dashboard 