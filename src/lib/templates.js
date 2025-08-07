import { supabase } from './supabase'

// Template Groups Management
export async function getTemplateGroups() {
  try {
    const { data, error } = await supabase
      .from('daily_msg_template_groups_with_count')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching template groups:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching template groups:', error)
    return []
  }
}

export async function createTemplateGroup(groupData) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_template_groups')
      .insert({
        name: groupData.name,
        description: groupData.description,
        color: groupData.color
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating template group:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error creating template group:', error)
    return { success: false, error: error.message }
  }
}

export async function updateTemplateGroup(id, groupData) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_template_groups')
      .update({
        name: groupData.name,
        description: groupData.description,
        color: groupData.color,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating template group:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error updating template group:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteTemplateGroup(id) {
  try {
    const { error } = await supabase
      .from('daily_msg_template_groups')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting template group:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting template group:', error)
    return { success: false, error: error.message }
  }
}

// Templates Management
export async function getTemplatesByGroup(groupId) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_templates')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching templates:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching templates:', error)
    return []
  }
}

export async function getAllTemplates() {
  try {
    const { data, error } = await supabase
      .from('daily_msg_templates')
      .select(`
        *,
        group:group_id (
          id,
          name,
          color
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all templates:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching all templates:', error)
    return []
  }
}

export async function createTemplate(templateData) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_templates')
      .insert({
        message_id: templateData.messageId,
        content: templateData.content,
        description: templateData.description,
        group_id: templateData.groupId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error creating template:', error)
    return { success: false, error: error.message }
  }
}

export async function updateTemplate(id, templateData) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_templates')
      .update({
        message_id: templateData.messageId,
        content: templateData.content,
        description: templateData.description,
        group_id: templateData.groupId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating template:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error updating template:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteTemplate(id) {
  try {
    const { error } = await supabase
      .from('daily_msg_templates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting template:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting template:', error)
    return { success: false, error: error.message }
  }
}

// Search and Filter Functions
export async function searchTemplates(searchTerm) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_templates')
      .select(`
        *,
        group:group_id (
          id,
          name,
          color
        )
      `)
      .or(`message_id.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching templates:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error searching templates:', error)
    return []
  }
}

export async function getTemplatesByGroupFilter(groupId) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_templates')
      .select(`
        *,
        group:group_id (
          id,
          name,
          color
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error filtering templates by group:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error filtering templates by group:', error)
    return []
  }
}

// Utility Functions
export function getGroupColor(colorName) {
  const colorMap = {
    'blue': 'bg-blue-500',
    'green': 'bg-green-500',
    'purple': 'bg-purple-500',
    'orange': 'bg-orange-500',
    'red': 'bg-red-500',
    'gray': 'bg-gray-500'
  }
  return colorMap[colorName] || 'bg-blue-500'
} 