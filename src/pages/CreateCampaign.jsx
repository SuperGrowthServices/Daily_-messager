import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Layers,
  Users,
  Calendar,
  Clock,
  Loader,
  Play
} from 'lucide-react'
import { getTemplateGroups } from '../lib/templates'
import { getUserTypes } from '../lib/users'
import { createCampaign } from '../lib/campaigns'
import { sendTestMessages } from '../lib/testMessages'

const CreateCampaign = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [templateGroups, setTemplateGroups] = useState([])
  const [userTypes, setUserTypes] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    templateGroupId: '',
    userTypeFilter: 'all',
    scheduleType: 'once',
    scheduleData: {
      timeWindow: { start: '09:00', end: '10:00' },
      timezone: 'UTC',
      daysOfWeek: []
    }
  })

  useEffect(() => {
    loadFormData()
  }, [])

  const loadFormData = async () => {
    setIsLoading(true)
    try {
      const [groupsData, typesData] = await Promise.all([
        getTemplateGroups(),
        getUserTypes()
      ])
      setTemplateGroups(groupsData)
      setUserTypes(typesData)
    } catch (error) {
      console.error('Error loading form data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Campaign Details' },
    { number: 2, title: 'Template Group' },
    { number: 3, title: 'Audience & Schedule' },
    { number: 4, title: 'Review' }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleScheduleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      scheduleData: {
        ...prev.scheduleData,
        [field]: value
      }
    }))
  }

  const handleTimeWindowChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      scheduleData: {
        ...prev.scheduleData,
        timeWindow: {
          ...prev.scheduleData.timeWindow,
          [field]: value
        }
      }
    }))
  }

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      scheduleData: {
        ...prev.scheduleData,
        daysOfWeek: prev.scheduleData.daysOfWeek.includes(day)
          ? prev.scheduleData.daysOfWeek.filter(d => d !== day)
          : [...prev.scheduleData.daysOfWeek, day]
      }
    }))
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.templateGroupId) {
      alert('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const result = await createCampaign(formData)
      if (result.success) {
        alert('Campaign created successfully!')
        navigate('/')
      } else {
        alert('Error creating campaign: ' + result.error)
      }
    } catch (error) {
      alert('Error creating campaign: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestMessages = async () => {
    if (!formData.templateGroupId) {
      alert('Please select a template group first')
      return
    }

    if (!confirm('This will send test messages to ALL users in the selected audience. Continue?')) {
      return
    }

    setIsTesting(true)
    try {
      console.log('🧪 Starting test message sending with campaign data:', formData)
      
      const result = await sendTestMessages(formData)
      
      if (result.success) {
        alert(`Test completed!\n\n📊 Results:\n• Total users: ${result.totalUsers}\n• Successful: ${result.successCount}\n• Failed: ${result.failureCount}\n\nCheck the browser console for detailed logs.`)
      } else {
        alert('Test failed: ' + result.error)
      }
    } catch (error) {
      console.error('❌ Test error:', error)
      alert('Test failed: ' + error.message)
    } finally {
      setIsTesting(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Campaign Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter campaign name"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe your campaign"
        />
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Layers className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Template Group Selection</h3>
            <p className="text-sm text-blue-700 mt-1">
              Select a template group. The system will randomly choose one message from this group for each user.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templateGroups.map((group) => (
          <div
            key={group.id}
            onClick={() => handleInputChange('templateGroupId', group.id)}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              formData.templateGroupId === group.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className={`w-3 h-3 rounded-full bg-${group.color}-500`}></div>
              <h3 className="font-medium text-gray-900">{group.name}</h3>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                {group.message_count} templates
              </span>
            </div>
            {group.description && (
              <p className="text-sm text-gray-600">{group.description}</p>
            )}
            <div className="mt-2 text-xs text-gray-500">
              Example: "{group.message_count > 0 ? 'Random message from this group' : 'No templates yet'}"
            </div>
          </div>
        ))}
      </div>

      {templateGroups.length === 0 && (
        <div className="text-center py-8">
          <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No template groups found</p>
          <button
            onClick={() => navigate('/templates')}
            className="btn-primary"
          >
            Create Template Group
          </button>
        </div>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Audience Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Audience
        </label>
        <select
          value={formData.userTypeFilter}
          onChange={(e) => handleInputChange('userTypeFilter', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Users</option>
          {userTypes.map((type) => (
            <option key={type.id} value={type.name.toLowerCase()}>
              {type.name} Users
            </option>
          ))}
        </select>
      </div>

      {/* Schedule Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Schedule Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: 'once', label: 'Once', icon: Calendar },
            { value: 'daily', label: 'Daily', icon: Clock },
            { value: 'weekly', label: 'Weekly', icon: Calendar }
          ].map((option) => {
            const Icon = option.icon
            return (
              <div
                key={option.value}
                onClick={() => handleInputChange('scheduleType', option.value)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  formData.scheduleType === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">{option.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Time Window */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Time Window
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Start Time</label>
            <input
              type="time"
              value={formData.scheduleData.timeWindow.start}
              onChange={(e) => handleTimeWindowChange('start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">End Time</label>
            <input
              type="time"
              value={formData.scheduleData.timeWindow.end}
              onChange={(e) => handleTimeWindowChange('end', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Timezone
        </label>
        <select
          value={formData.scheduleData.timezone}
          onChange={(e) => handleScheduleChange('timezone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="Europe/London">London</option>
          <option value="Europe/Paris">Paris</option>
          <option value="Asia/Dubai">Dubai</option>
          <option value="Asia/Tokyo">Tokyo</option>
        </select>
      </div>

      {/* Days of Week (for weekly schedule) */}
      {formData.scheduleType === 'weekly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Days of Week
          </label>
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => handleDayToggle(day.toLowerCase())}
                className={`p-2 text-sm font-medium rounded-md transition-colors ${
                  formData.scheduleData.daysOfWeek.includes(day.toLowerCase())
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderStep4 = () => {
    const selectedGroup = templateGroups.find(g => g.id === formData.templateGroupId)
    const selectedUserType = userTypes.find(t => t.name.toLowerCase() === formData.userTypeFilter)

    return (
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Campaign Details</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{formData.name || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Description:</span>
                  <span className="ml-2 font-medium">{formData.description || 'Not specified'}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Template Group</h4>
              {selectedGroup ? (
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full bg-${selectedGroup.color}-500`}></div>
                  <span className="font-medium">{selectedGroup.name}</span>
                  <span className="text-gray-500">({selectedGroup.message_count} templates)</span>
                </div>
              ) : (
                <span className="text-gray-500">Not selected</span>
              )}
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Audience</h4>
              <span className="font-medium">
                {formData.userTypeFilter === 'all' ? 'All Users' : `${formData.userTypeFilter} Users`}
              </span>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Schedule</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium capitalize">{formData.scheduleType}</span>
                </div>
                <div>
                  <span className="text-gray-600">Time:</span>
                  <span className="ml-2 font-medium">
                    {formData.scheduleData.timeWindow.start} - {formData.scheduleData.timeWindow.end}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Timezone:</span>
                  <span className="ml-2 font-medium">{formData.scheduleData.timezone}</span>
                </div>
                {formData.scheduleType === 'weekly' && formData.scheduleData.daysOfWeek.length > 0 && (
                  <div>
                    <span className="text-gray-600">Days:</span>
                    <span className="ml-2 font-medium">
                      {formData.scheduleData.daysOfWeek.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Layers className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Message Strategy</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Each user will receive a randomly selected message from the "{selectedGroup?.name || 'selected'}" template group.
                  This ensures variety and prevents message fatigue.
                </p>
              </div>
            </div>
          </div>

          {/* Test Button */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <Play className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Test Messages (Development)</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Send test messages to all users in the selected audience immediately. 
                    This will use the current campaign settings and log results to the database.
                  </p>
                </div>
              </div>
              <button
                onClick={handleTestMessages}
                disabled={isTesting || !formData.templateGroupId}
                className="btn-primary flex items-center space-x-2 px-4 py-2"
              >
                {isTesting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>TEST MESSAGES</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      default:
        return renderStep1()
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin mr-3" />
          <span className="text-lg">Loading campaign creator...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Campaign</h1>
          <p className="text-gray-600 mt-2">Set up your automated WhatsApp messaging campaign</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="btn-secondary flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= step.number
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step.number ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{step.number}</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-blue-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        {renderCurrentStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="flex space-x-3">
          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              className="btn-primary flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn-primary flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Create Campaign</span>
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreateCampaign 