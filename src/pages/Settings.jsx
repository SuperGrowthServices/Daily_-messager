import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Key, Clock, Save, Loader, Edit, Trash2, CheckCircle, XCircle, Plus } from 'lucide-react'
import { getWasenderSessions, createWasenderSession, updateWasenderSession, deleteWasenderSession, checkWasenderStatus, getSchedulerSettings, updateSchedulerSettings } from '../lib/wasender'
import { getApiKeyFromSupabase } from '../lib/config'

const Settings = () => {
  const [sessions, setSessions] = useState([])
  const [schedulerSettings, setSchedulerSettings] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [sessionFormData, setSessionFormData] = useState({
    name: '',
    api_key: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const [sessionsData, settingsData] = await Promise.all([
        getWasenderSessions(),
        getSchedulerSettings()
      ])
      setSessions(sessionsData)
      setSchedulerSettings(settingsData)
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSessionSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      let result
      if (selectedSession) {
        result = await updateWasenderSession(selectedSession.id, sessionFormData)
      } else {
        result = await createWasenderSession(sessionFormData)
      }

      if (result.success) {
        setShowSessionModal(false)
        setSelectedSession(null)
        setSessionFormData({ name: '', api_key: '' })
        await loadSettings()
      } else {
        alert('Error saving session: ' + result.error)
      }
    } catch (error) {
      alert('Error saving session: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this API key?')) return

    try {
      const result = await deleteWasenderSession(sessionId)
      if (result.success) {
        await loadSettings()
      } else {
        alert('Error deleting API key: ' + result.error)
      }
    } catch (error) {
      alert('Error deleting API key: ' + error.message)
    }
  }

  const handleCheckStatus = async (sessionId) => {
    try {
      const result = await checkWasenderStatus(sessionId)
      if (result.success) {
        alert('API Status: Connected and working properly!')
      } else {
        alert('API Status: ' + result.error)
      }
    } catch (error) {
      alert('Error checking status: ' + error.message)
    }
  }

  const handleSchedulerSettingsSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateSchedulerSettings(schedulerSettings)
      if (result.success) {
        alert('Scheduler settings saved successfully!')
      } else {
        alert('Error saving scheduler settings: ' + result.error)
      }
    } catch (error) {
      alert('Error saving scheduler settings: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSchedulerSettingChange = (field, value) => {
    setSchedulerSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEditSession = (session) => {
    setSelectedSession(session)
    setSessionFormData({
      name: session.name || 'Default Session',
      api_key: session.api_key
    })
    setShowSessionModal(true)
  }

  const handleAddSession = () => {
    setSelectedSession(null)
    setSessionFormData({ name: '', api_key: '' })
    setShowSessionModal(true)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your WhatsApp messaging system</p>
      </div>

      {/* Wasender API Configuration */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Wasender API Configuration
            </h2>
            {sessions.length === 0 && (
              <button
                onClick={handleAddSession}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add API Key</span>
              </button>
            )}
          </div>
        </div>
        <div className="p-6">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No API key configured</p>
              <button
                onClick={handleAddSession}
                className="btn-primary"
              >
                Add API Key
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{session.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        API Key: {session.api_key.substring(0, 8)}...
                      </p>
                      <div className="flex items-center mt-2">
                        {session.status === 'connected' ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 mr-2" />
                        )}
                        <span className={`text-sm font-medium ${
                          session.status === 'connected' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCheckStatus(session.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Check Status"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditSession(session)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
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

      {/* Scheduler Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Scheduler Settings
          </h2>
        </div>
        <div className="p-6">
          {schedulerSettings ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Interval (seconds)</label>
                <input
                  type="number"
                  value={schedulerSettings.min_interval_seconds}
                  onChange={(e) => handleSchedulerSettingChange('min_interval_seconds', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="10"
                  max="300"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum time between messages (10-300 seconds)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select
                  value={schedulerSettings.timezone}
                  onChange={(e) => handleSchedulerSettingChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (UTC-5)</option>
                  <option value="Europe/London">London (UTC+0)</option>
                  <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Auto Schedule</label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={schedulerSettings.auto_schedule_enabled}
                    onChange={(e) => handleSchedulerSettingChange('auto_schedule_enabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Automatically schedule campaigns at midnight</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Daily Schedule Time</label>
                <input
                  type="time"
                  value={schedulerSettings.daily_schedule_time}
                  onChange={(e) => handleSchedulerSettingChange('daily_schedule_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Time to run daily scheduler (if auto-schedule is enabled) - All times in Dubai timezone</p>
              </div>
              <button
                onClick={handleSchedulerSettingsSave}
                disabled={isSaving}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            </div>
          )}
        </div>
      </div>

      {/* Session Form Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedSession ? 'Edit API Key' : 'Add API Key'}
            </h3>
            <form onSubmit={handleSessionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={sessionFormData.name}
                  onChange={(e) => setSessionFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Default Session"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                <input
                  type="password"
                  value={sessionFormData.api_key}
                  onChange={(e) => setSessionFormData(prev => ({ ...prev, api_key: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your Wassender API key"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 btn-primary"
                >
                  {isSaving ? 'Saving...' : (selectedSession ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings 