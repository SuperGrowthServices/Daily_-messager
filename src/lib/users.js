import { supabase } from './supabase'

// User Types Management
export async function getUserTypes() {
  try {
    const { data, error } = await supabase
      .from('daily_msg_user_types')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching user types:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching user types:', error)
    return []
  }
}

export async function createUserType(typeData) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_user_types')
      .insert({
        name: typeData.name,
        description: typeData.description,
        color: typeData.color
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user type:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error creating user type:', error)
    return { success: false, error: error.message }
  }
}

export async function updateUserType(id, typeData) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_user_types')
      .update({
        name: typeData.name,
        description: typeData.description,
        color: typeData.color,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user type:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error updating user type:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteUserType(id) {
  try {
    const { error } = await supabase
      .from('daily_msg_user_types')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting user type:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting user type:', error)
    return { success: false, error: error.message }
  }
}

// Users Management
export async function getUsers() {
  try {
    const { data, error } = await supabase
      .from('daily_msg_users')
      .select(`
        *,
        user_type:user_type_id (
          id,
          name,
          color
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

export async function createUser(userData) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_users')
      .insert({
        name: userData.name,
        whatsapp_number: userData.whatsappNumber,
        business_name: userData.businessName,
        user_type_id: userData.userTypeId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error creating user:', error)
    return { success: false, error: error.message }
  }
}

export async function updateUser(id, userData) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_users')
      .update({
        name: userData.name,
        whatsapp_number: userData.whatsappNumber,
        business_name: userData.businessName,
        user_type_id: userData.userTypeId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error updating user:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteUser(id) {
  try {
    const { error } = await supabase
      .from('daily_msg_users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting user:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { success: false, error: error.message }
  }
}

export async function updateUserTypeQuick(id, userTypeId) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_users')
      .update({
        user_type_id: userTypeId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user type:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error updating user type:', error)
    return { success: false, error: error.message }
  }
} 