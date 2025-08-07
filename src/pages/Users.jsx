import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Users as UsersIcon, 
  UserPlus, 
  Phone, 
  Building, 
  User, 
  Crown, 
  Clock, 
  AlertCircle, 
  Settings, 
  Tag,
  Loader
} from 'lucide-react'
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  getUserTypes, 
  createUserType, 
  updateUserType, 
  deleteUserType,
  updateUserTypeQuick
} from '../lib/users'

const Users = () => {
  const [users, setUsers] = useState([])
  const [userTypes, setUserTypes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    whatsappNumber: '',
    businessName: '',
    userTypeId: ''
  })
  const [showTypesModal, setShowTypesModal] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [typeFormData, setTypeFormData] = useState({
    name: '',
    description: '',
    color: 'blue'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTypes, setIsLoadingTypes] = useState(false)

  // Load users and user types on component mount
  useEffect(() => {
    loadUsers()
    loadUserTypes()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const usersData = await getUsers()
      setUsers(usersData)
    } catch (error) {
      console.error('Error loading users:', error)
      alert('Failed to load users. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserTypes = async () => {
    setIsLoadingTypes(true)
    try {
      const typesData = await getUserTypes()
      setUserTypes(typesData)
    } catch (error) {
      console.error('Error loading user types:', error)
      alert('Failed to load user types. Please try again.')
    } finally {
      setIsLoadingTypes(false)
    }
  }

  // Filter users based on search and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.whatsapp_number?.includes(searchTerm) ||
                         user.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = statusFilter === 'all' || 
                         user.user_type?.name?.toLowerCase() === statusFilter.toLowerCase()
    
    return matchesSearch && matchesFilter
  })

  // Helper functions
  const getUserTypeColor = (typeName) => {
    const type = userTypes.find(t => t.name === typeName)
    return type?.color || 'gray'
  }

  const getUserTypeIcon = (typeName) => {
    switch (typeName?.toLowerCase()) {
      case 'premium': return <Crown className="w-4 h-4" />
      case 'new': return <Clock className="w-4 h-4" />
      case 'inactive': return <AlertCircle className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  // User management functions
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.whatsappNumber.trim() || !formData.userTypeId) {
      alert('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      let result
      if (editingUser) {
        result = await updateUser(editingUser.id, formData)
      } else {
        result = await createUser(formData)
      }

      if (result.success) {
        setShowAddModal(false)
        setEditingUser(null)
        setFormData({ name: '', whatsappNumber: '', businessName: '', userTypeId: '' })
        loadUsers() // Reload users
        alert(editingUser ? 'User updated successfully!' : 'User created successfully!')
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      whatsappNumber: user.whatsapp_number || '',
      businessName: user.business_name || '',
      userTypeId: user.user_type_id || ''
    })
    setShowAddModal(true)
  }

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    setIsLoading(true)
    try {
      const result = await deleteUser(userId)
      if (result.success) {
        loadUsers() // Reload users
        alert('User deleted successfully!')
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickTypeChange = async (userId, newTypeId) => {
    try {
      const result = await updateUserTypeQuick(userId, newTypeId)
      if (result.success) {
        loadUsers() // Reload users
      } else {
        alert('Error updating user type: ' + result.error)
      }
    } catch (error) {
      alert('Error updating user type: ' + error.message)
    }
  }

  // User type management functions
  const handleTypeInputChange = (e) => {
    const { name, value } = e.target
    setTypeFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTypeSubmit = async (e) => {
    e.preventDefault()
    
    if (!typeFormData.name.trim()) {
      alert('Please enter a type name')
      return
    }

    setIsLoadingTypes(true)
    try {
      let result
      if (editingType) {
        result = await updateUserType(editingType.id, typeFormData)
      } else {
        result = await createUserType(typeFormData)
      }

      if (result.success) {
        setShowTypesModal(false)
        setEditingType(null)
        setTypeFormData({ name: '', description: '', color: 'blue' })
        loadUserTypes() // Reload user types
        alert(editingType ? 'User type updated successfully!' : 'User type created successfully!')
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setIsLoadingTypes(false)
    }
  }

  const handleEditType = (type) => {
    setEditingType(type)
    setTypeFormData({
      name: type.name || '',
      description: type.description || '',
      color: type.color || 'blue'
    })
  }

  const handleDeleteType = async (typeId) => {
    if (!confirm('Are you sure you want to delete this user type?')) return

    setIsLoadingTypes(true)
    try {
      const result = await deleteUserType(typeId)
      if (result.success) {
        loadUserTypes() // Reload user types
        alert('User type deleted successfully!')
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setIsLoadingTypes(false)
    }
  }

  const colorOptions = [
    { name: 'blue', label: 'Blue' },
    { name: 'green', label: 'Green' },
    { name: 'purple', label: 'Purple' },
    { name: 'orange', label: 'Orange' },
    { name: 'red', label: 'Red' },
    { name: 'gray', label: 'Gray' }
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage your users and user types</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTypesModal(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Manage Types</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
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
              placeholder="Search users..."
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
            <option value="all">All Types</option>
            {userTypes.map(type => (
              <option key={type.id} value={type.name}>{type.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WhatsApp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{user.whatsapp_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{user.business_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.user_type_id || ''}
                        onChange={(e) => handleQuickTypeChange(user.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select Type</option>
                        {userTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
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
                  WhatsApp Number *
                </label>
                <input
                  type="text"
                  name="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={handleInputChange}
                  placeholder="+971501234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Type *
                </label>
                <select
                  name="userTypeId"
                  value={formData.userTypeId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Type</option>
                  {userTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingUser(null)
                    setFormData({ name: '', whatsappNumber: '', businessName: '', userTypeId: '' })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </span>
                  ) : (
                    editingUser ? 'Update' : 'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Types Modal */}
      {showTypesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Manage User Types</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Types */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Current Types</h3>
                {isLoadingTypes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    <span>Loading types...</span>
                  </div>
                ) : userTypes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No user types found</p>
                ) : (
                  <div className="space-y-3">
                    {userTypes.map(type => (
                      <div key={type.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full bg-${type.color}-500`}></div>
                          <div>
                            <div className="font-medium">{type.name}</div>
                            {type.description && (
                              <div className="text-sm text-gray-500">{type.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditType(type)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteType(type.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add/Edit Type Form */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {editingType ? 'Edit Type' : 'Add New Type'}
                </h3>
                <form onSubmit={handleTypeSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={typeFormData.name}
                      onChange={handleTypeInputChange}
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
                      value={typeFormData.description}
                      onChange={handleTypeInputChange}
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
                            checked={typeFormData.color === color.name}
                            onChange={handleTypeInputChange}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full bg-${color.name}-500 border-2 ${
                            typeFormData.color === color.name ? 'border-gray-900' : 'border-gray-300'
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
                        setShowTypesModal(false)
                        setEditingType(null)
                        setTypeFormData({ name: '', description: '', color: 'blue' })
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={isLoadingTypes}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoadingTypes ? (
                        <span className="flex items-center justify-center">
                          <Loader className="w-4 h-4 animate-spin mr-2" />
                          Saving...
                        </span>
                      ) : (
                        editingType ? 'Update' : 'Create'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users 