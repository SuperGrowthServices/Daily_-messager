import { supabase } from './supabase'

// Campaigns Management
export async function getCampaigns() {
  try {
    const { data, error } = await supabase
      .from('daily_msg_campaigns_with_details')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching campaigns:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return []
  }
}

export async function getActiveCampaigns() {
  try {
    const { data, error } = await supabase
      .from('daily_msg_campaigns_with_details')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching campaigns:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return []
  }
}

export async function createCampaign(campaignData) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_campaigns')
      .insert({
        name: campaignData.name,
        description: campaignData.description,
        template_group_id: campaignData.templateGroupId,
        user_type_filter: campaignData.userTypeFilter,
        schedule_type: campaignData.scheduleType,
        schedule_data: campaignData.scheduleData,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error creating campaign:', error)
    return { success: false, error: error.message }
  }
}

export async function updateCampaign(id, campaignData) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_campaigns')
      .update({
        name: campaignData.name,
        description: campaignData.description,
        template_group_id: campaignData.templateGroupId,
        user_type_filter: campaignData.userTypeFilter,
        schedule_type: campaignData.scheduleType,
        schedule_data: campaignData.scheduleData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating campaign:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error updating campaign:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteCampaign(id) {
  try {
    const { error } = await supabase
      .from('daily_msg_campaigns')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting campaign:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return { success: false, error: error.message }
  }
}

// Dashboard Statistics
export async function getDashboardStats() {
  try {
    // Get total campaigns
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('daily_msg_campaigns')
      .select('status, messages_sent')

    if (campaignsError) {
      console.error('Error fetching campaigns for stats:', campaignsError)
      return getDefaultStats()
    }

    // Get total users
    const { data: usersData, error: usersError } = await supabase
      .from('daily_msg_users')
      .select('id')

    if (usersError) {
      console.error('Error fetching users for stats:', usersError)
      return getDefaultStats()
    }

    // Get total template groups
    const { data: groupsData, error: groupsError } = await supabase
      .from('daily_msg_template_groups')
      .select('id')

    if (groupsError) {
      console.error('Error fetching template groups for stats:', groupsError)
      return getDefaultStats()
    }

    // Calculate statistics
    const totalCampaigns = campaignsData?.length || 0
    const activeCampaigns = campaignsData?.filter(c => c.status === 'active').length || 0
    const totalMessagesSent = campaignsData?.reduce((sum, c) => sum + (c.messages_sent || 0), 0) || 0
    const totalUsers = usersData?.length || 0
    const totalTemplateGroups = groupsData?.length || 0

    return {
      totalCampaigns,
      activeCampaigns,
      totalMessagesSent,
      totalUsers,
      totalTemplateGroups
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    return getDefaultStats()
  }
}

function getDefaultStats() {
  return {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalMessagesSent: 0,
    totalUsers: 0,
    totalTemplateGroups: 0
  }
}

// Utility Functions
export function formatScheduleData(scheduleData) {
  if (!scheduleData) return 'Not scheduled'
  
  try {
    const data = typeof scheduleData === 'string' ? JSON.parse(scheduleData) : scheduleData
    
    if (data.timeWindow) {
      const start = data.timeWindow.start || '00:00'
      const end = data.timeWindow.end || '23:59'
      return `${start} - ${end}`
    }
    
    return 'Scheduled'
  } catch (error) {
    return 'Scheduled'
  }
}

export function formatUserTypeFilter(filter) {
  const filterMap = {
    'all': 'All Users',
    'premium': 'Premium Users',
    'new': 'New Users',
    'inactive': 'Inactive Users'
  }
  return filterMap[filter] || filter
}

export function getStatusColor(status) {
  const statusColors = {
    'draft': 'bg-gray-100 text-gray-800',
    'active': 'bg-green-100 text-green-800',
    'paused': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-blue-100 text-blue-800'
  }
  return statusColors[status] || 'bg-gray-100 text-gray-800'
} 