import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  FileText, 
  Layers, 
  MessageSquare, 
  User, 
  Building, 
  AlertCircle, 
  Settings, 
  Tag, 
  ChevronDown, 
  ChevronRight, 
  Users, 
  Hash,
  Loader
} from 'lucide-react'
import { 
  getTemplateGroups, 
  createTemplateGroup, 
  updateTemplateGroup, 
  deleteTemplateGroup,
  getTemplatesByGroup,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  searchTemplates,
  getGroupColor
} from '../lib/templates'

const Templates = () => {
  const [templateGroups, setTemplateGroups] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddGroupModal, setShowAddGroupModal] = useState(false)
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [expandedGroups, setExpandedGroups] = useState(new Set())
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue'
  })
  const [templateFormData, setTemplateFormData] = useState({
    messageId: '',
    content: '',
    description: '',
    groupId: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)

  // Available user variables for templates
  const userVariables = [
    { key: '{name}', label: 'User Name', description: 'Full name of the user' },
    { key: '{businessName}', label: 'Business Name', description: 'User\'s business name' }
  ]

  const colorOptions = [
    { name: 'blue', label: 'Blue' },
    { name: 'green', label: 'Green' },
    { name: 'purple', label: 'Purple' },
    { name: 'orange', label: 'Orange' },
    { name: 'red', label: 'Red' },
    { name: 'gray', label: 'Gray' }
  ]

  // Load template groups on component mount
  useEffect(() => {
    loadTemplateGroups()
  }, [])

  const loadTemplateGroups = async () => {
    setIsLoadingGroups(true)
    try {
      const groupsData = await getTemplateGroups()
      setTemplateGroups(groupsData)
    } catch (error) {
      console.error('Error loading template groups:', error)
      alert('Failed to load template groups. Please try again.')
    } finally {
      setIsLoadingGroups(false)
    }
  }

  // Filter template groups based on search
  const filteredGroups = templateGroups.filter(group => {
    const matchesSearch = group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = statusFilter === 'all' || group.name === statusFilter
    
    return matchesSearch && matchesFilter
  })

  // Helper functions
  const getGroupColorClass = (colorName) => {
    return getGroupColor(colorName)
  }

  // Template group management functions
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleGroupSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Please enter a group name')
      return
    }

    setIsLoadingGroups(true)
    try {
      let result
      if (editingGroup) {
        result = await updateTemplateGroup(editingGroup.id, formData)
      } else {
        result = await createTemplateGroup(formData)
      }

      if (result.success) {
        setShowAddGroupModal(false)
        setEditingGroup(null)
        setFormData({ name: '', description: '', color: 'blue' })
        loadTemplateGroups() // Reload groups
        alert(editingGroup ? 'Template group updated successfully!' : 'Template group created successfully!')
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setIsLoadingGroups(false)
    }
  }

  const handleEditGroup = (group) => {
    setEditingGroup(group)
    setFormData({
      name: group.name || '',
      description: group.description || '',
      color: group.color || 'blue'
    })
    setShowAddGroupModal(true)
  }

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Are you sure you want to delete this template group? This will also delete all templates in this group.')) return

    setIsLoadingGroups(true)
    try {
      const result = await deleteTemplateGroup(groupId)
      if (result.success) {
        loadTemplateGroups() // Reload groups
        alert('Template group deleted successfully!')
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setIsLoadingGroups(false)
    }
  }

  // Template management functions
  const handleTemplateInputChange = (e) => {
    const { name, value } = e.target
    setTemplateFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTemplateSubmit = async (e) => {
    e.preventDefault()
    
    if (!templateFormData.messageId.trim() || !templateFormData.content.trim() || !templateFormData.groupId) {
      alert('Please fill in all required fields')
      return
    }

    setIsLoadingTemplates(true)
    try {
      let result
      if (editingTemplate) {
        result = await updateTemplate(editingTemplate.id, templateFormData)
      } else {
        result = await createTemplate(templateFormData)
      }

      if (result.success) {
        setShowAddTemplateModal(false)
        setEditingTemplate(null)
        setTemplateFormData({ messageId: '', content: '', description: '', groupId: '' })
        loadTemplateGroups() // Reload groups to update counts
        alert(editingTemplate ? 'Template updated successfully!' : 'Template created successfully!')
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate(template)
    setTemplateFormData({
      messageId: template.message_id || '',
      content: template.content || '',
      description: template.description || '',
      groupId: template.group_id || ''
    })
    setShowAddTemplateModal(true)
  }

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    setIsLoadingTemplates(true)
    try {
      const result = await deleteTemplate(templateId)
      if (result.success) {
        loadTemplateGroups() // Reload groups to update counts
        alert('Template deleted successfully!')
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const toggleGroupExpansion = (groupId) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  const insertVariable = (variable) => {
    setTemplateFormData(prev => ({
      ...prev,
      content: prev.content + variable
    }))
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Template Management</h1>
          <p className="text-gray-600 mt-2">Create and manage message templates with user data integration</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddGroupModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Layers className="w-4 h-4" />
            <span>Add Group</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search templates, groups, or message IDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Groups</option>
            {templateGroups.map(group => (
              <option key={group.id} value={group.name}>{group.name}</option>
            ))}
          </select>
        </div>
        <button className="btn-secondary flex items-center space-x-2">
          <Filter className="w-4 h-4" />
          <span>More Filters</span>
        </button>
      </div>

      {/* Template Groups List */}
      <div className="space-y-4">
        {isLoadingGroups ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin mr-3" />
            <span>Loading template groups...</span>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No template groups found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or create your first template group</p>
            <button
              onClick={() => setShowAddGroupModal(true)}
              className="btn-primary"
            >
              Create Your First Group
            </button>
          </div>
        ) : (
          filteredGroups.map(group => (
            <div key={group.id} className="card">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleGroupExpansion(group.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expandedGroups.has(group.id) ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                  <div className={`w-3 h-3 rounded-full ${getGroupColorClass(group.color)}`}></div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                    <p className="text-sm text-gray-600">{group.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">{group.message_count} templates</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedGroup(group)
                        setTemplateFormData(prev => ({ ...prev, groupId: group.id }))
                        setShowAddTemplateModal(true)
                      }}
                      className="btn-primary flex items-center space-x-2 px-3 py-1 text-sm"
                      title="Add Template"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Template</span>
                    </button>
                    <button
                      onClick={() => handleEditGroup(group)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Group Content */}
              {expandedGroups.has(group.id) && (
                <div className="border-t border-gray-200 p-4">
                  <TemplateList 
                    groupId={group.id} 
                    onEdit={handleEditTemplate}
                    onDelete={handleDeleteTemplate}
                    isLoading={isLoadingTemplates}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Group Modal */}
      {showAddGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingGroup ? 'Edit Template Group' : 'Add New Template Group'}
            </h2>
            <form onSubmit={handleGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {colorOptions.map(color => (
                    <label key={color.name} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="color"
                        value={color.name}
                        checked={formData.color === color.name}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full bg-${color.name}-500 border-2 ${
                        formData.color === color.name ? 'border-gray-900' : 'border-gray-300'
                      }`}></div>
                      <span className="text-sm">{color.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddGroupModal(false)
                    setEditingGroup(null)
                    setFormData({ name: '', description: '', color: 'blue' })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoadingGroups}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoadingGroups ? (
                    <span className="flex items-center justify-center">
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </span>
                  ) : (
                    editingGroup ? 'Update' : 'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Template Modal */}
      {showAddTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingTemplate ? 'Edit Template' : 'Add New Template'}
            </h2>
            <form onSubmit={handleTemplateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message ID *
                    </label>
                    <input
                      type="text"
                      name="messageId"
                      value={templateFormData.messageId}
                      onChange={handleTemplateInputChange}
                      placeholder="e.g., MORNING_001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Group *
                    </label>
                    <select
                      name="groupId"
                      value={templateFormData.groupId}
                      onChange={handleTemplateInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Group</option>
                      {templateGroups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={templateFormData.description}
                      onChange={handleTemplateInputChange}
                      placeholder="Brief description of this template"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Content *
                  </label>
                  <textarea
                    name="content"
                    value={templateFormData.content}
                    onChange={handleTemplateInputChange}
                    rows="6"
                    placeholder="Enter your message content. Use {name} and {businessName} for dynamic content."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />

                  {/* Available Variables */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Available Variables</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {userVariables.map(variable => (
                        <div key={variable.key} className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-mono text-blue-600">{variable.key}</span>
                            <span className="text-sm text-gray-600 ml-2">- {variable.description}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => insertVariable(variable.key)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Insert
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Tip:</p>
                        <p>Use variables like {`{name}`} and {`{businessName}`} to personalize your messages. These will be replaced with actual user data when the message is sent.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTemplateModal(false)
                    setEditingTemplate(null)
                    setTemplateFormData({ messageId: '', content: '', description: '', groupId: '' })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoadingTemplates}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoadingTemplates ? (
                    <span className="flex items-center justify-center">
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </span>
                  ) : (
                    editingTemplate ? 'Update' : 'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Template List Component
const TemplateList = ({ groupId, onEdit, onDelete, isLoading }) => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [groupId])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const templatesData = await getTemplatesByGroup(groupId)
      setTemplates(templatesData)
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader className="w-4 h-4 animate-spin mr-2" />
        <span>Loading templates...</span>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No templates in this group yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {templates.map(template => (
        <div key={template.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <Hash className="w-4 h-4 text-gray-400" />
              <span className="font-mono text-sm text-gray-600">{template.message_id}</span>
            </div>
            <p className="text-sm text-gray-900 mb-1">{template.content}</p>
            {template.description && (
              <p className="text-xs text-gray-500">{template.description}</p>
            )}
          </div>
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => onEdit(template)}
              className="text-blue-600 hover:text-blue-900"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(template.id)}
              className="text-red-600 hover:text-red-900"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Templates 