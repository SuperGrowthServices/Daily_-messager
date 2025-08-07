import React, { useState, useEffect } from 'react'
import { 
  Clock, 
  Users, 
  MessageSquare, 
  Calendar,
  Loader,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play
} from 'lucide-react'
import { getScheduledMessagesForNext24Hours, processScheduledMessages } from '../lib/scheduler'
import { scheduleCampaignMessages } from '../lib/scheduler'

const Staged = () => {
  const [scheduledMessages, setScheduledMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isScheduling, setIsScheduling] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadScheduledMessages()
  }, [])

  const loadScheduledMessages = async () => {
    setIsLoading(true)
    try {
      const messages = await getScheduledMessagesForNext24Hours()
      setScheduledMessages(messages)
    } catch (error) {
      console.error('Error loading scheduled messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleScheduleCampaign = async (campaignId) => {
    setIsScheduling(true)
    try {
      const result = await scheduleCampaignMessages(campaignId)
      if (result.success) {
        alert(`Campaign scheduled successfully! ${result.messageCount} messages will be sent.`)
        await loadScheduledMessages() // Reload to show new scheduled messages
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
      await loadScheduledMessages() // Reload to show updated status
    } catch (error) {
      alert('Error processing messages: ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatScheduledTime = (scheduledTime) => {
    const date = new Date(scheduledTime)
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

  const formatTimeOnly = (scheduledTime) => {
    const date = new Date(scheduledTime)
    return date.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Dubai',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'sent':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Group messages by campaign
  const messagesByCampaign = scheduledMessages.reduce((acc, message) => {
    if (!acc[message.campaign_id]) {
      acc[message.campaign_id] = {
        campaign: {
          id: message.campaign_id,
          name: message.campaign_name,
          status: message.campaign_status
        },
        messages: []
      }
    }
    acc[message.campaign_id].messages.push(message)
    return acc
  }, {})

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin mr-3" />
          <span className="text-lg">Loading staged messages...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staged Messages</h1>
          <p className="text-gray-600 mt-2">
            Messages scheduled for the next 24 hours
            <span className="text-sm text-blue-600 ml-2">(All times in Dubai timezone)</span>
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {scheduledMessages.length} messages scheduled
          </div>
          <button
            onClick={handleProcessMessages}
            disabled={isProcessing || scheduledMessages.length === 0}
            className="btn-secondary flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>{isProcessing ? 'Processing...' : 'Process Messages'}</span>
          </button>
          <button
            onClick={loadScheduledMessages}
            className="btn-secondary"
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.keys(messagesByCampaign).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Messages Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">
                {scheduledMessages.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique Recipients</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(scheduledMessages.map(m => m.user_id)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Next Message</p>
              <p className="text-lg font-bold text-gray-900">
                {scheduledMessages.length > 0 
                  ? formatTimeOnly(scheduledMessages[0].scheduled_time)
                  : 'None'
                }
              </p>
              <p className="text-xs text-gray-500">
                {scheduledMessages.length > 0 
                  ? 'Dubai time'
                  : 'No messages scheduled'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Groups */}
      {Object.keys(messagesByCampaign).length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages Scheduled</h3>
          <p className="text-gray-500 mb-4">
            No messages are currently scheduled for the next 24 hours. 
            <br />
            <span className="text-sm">Create a campaign and schedule it to see staged messages here.</span>
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => window.location.href = '/campaigns/create'}
              className="btn-primary"
            >
              Create Campaign
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="btn-secondary"
            >
              View Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(messagesByCampaign).map(({ campaign, messages }) => (
            <div key={campaign.id} className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
                    <p className="text-sm text-gray-500">
                      {messages.length} messages scheduled
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => handleScheduleCampaign(campaign.id)}
                        disabled={isScheduling}
                        className="btn-primary text-sm"
                      >
                        {isScheduling ? 'Scheduling...' : 'Schedule Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                   {messages.slice(0, 5).map((message) => (
                     <div key={message.id} className="border border-gray-200 rounded-lg p-4">
                       <div className="flex items-start justify-between">
                         <div className="flex-1">
                           <div className="flex items-center space-x-3 mb-2">
                             {getStatusIcon(message.status)}
                             <span className="font-medium text-gray-900">
                               {message.user_name} ({message.user_phone})
                             </span>
                             <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(message.status)}`}>
                               {message.status}
                             </span>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                             <div>
                               <span className="text-gray-500 font-medium">Template:</span>
                               <p className="text-gray-900">{message.template_group_name}</p>
                             </div>
                             <div>
                               <span className="text-gray-500 font-medium">Scheduled Time:</span>
                               <p className="text-gray-900 font-semibold">
                                 {formatTimeOnly(message.scheduled_time)} (Dubai)
                               </p>
                               <p className="text-xs text-gray-500">
                                 {formatScheduledTime(message.scheduled_time)}
                               </p>
                             </div>
                             <div>
                               <span className="text-gray-500 font-medium">Status:</span>
                               <p className="text-gray-900 capitalize">{message.status}</p>
                             </div>
                           </div>
                           
                           {message.template_content && (
                             <div className="bg-gray-50 rounded p-3 text-sm">
                               <span className="font-medium">Message Preview:</span>
                               <p className="mt-1 text-gray-700">{message.template_content}</p>
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                   ))}
                  
                  {messages.length > 5 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        +{messages.length - 5} more messages scheduled
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Staged 