import { supabase } from './supabase'

const CONFIG_KEYS = {
  WASSENDER_API_KEY: 'wassender_api_key',
}

// Legacy localStorage functions for backward compatibility
export function getApiKey() {
  return localStorage.getItem('WASSENDER_API_KEY')
}

export function setApiKey(apiKey) {
  localStorage.setItem('WASSENDER_API_KEY', apiKey)
}

export function removeApiKey() {
  localStorage.removeItem('WASSENDER_API_KEY')
}

// Supabase-based functions
export async function getApiKeyFromSupabase() {
  try {
    const result = await getWassenderApiKey()
    if (result.success && result.value) {
      return result.value
    }
    return null
  } catch (error) {
    console.error('Error getting API key from Supabase:', error)
    // Fallback to localStorage
    return getApiKey()
  }
}

export async function setApiKeyToSupabase(apiKey) {
  try {
    const result = await setWassenderApiKey(apiKey)
    if (result.success) {
      // Also update localStorage for backward compatibility
      setApiKey(apiKey)
      return true
    }
    console.error('Failed to save API key to Supabase:', result.error)
    return false
  } catch (error) {
    console.error('Error saving API key to Supabase:', error)
    // Fallback to localStorage
    setApiKey(apiKey)
    return false
  }
}

export async function removeApiKeyFromSupabase() {
  try {
    const result = await removeWassenderApiKey()
    if (result.success) {
      // Also remove from localStorage for backward compatibility
      removeApiKey()
      return true
    }
    console.error('Failed to remove API key from Supabase:', result.error)
    return false
  } catch (error) {
    console.error('Error removing API key from Supabase:', error)
    // Fallback to localStorage
    removeApiKey()
    return false
  }
}

// Helper functions for API config
async function getApiConfig(key) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_api_config')
      .select('config_value')
      .eq('config_key', key)
      .single()

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      value: data?.config_value || ''
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function setApiConfig(key, value) {
  try {
    // First try to update existing record
    const { data: updateData, error: updateError } = await supabase
      .from('daily_msg_api_config')
      .update({ config_value: value })
      .eq('config_key', key)
      .select()
      .single()

    if (updateError && updateError.code === 'PGRST116') {
      // Record doesn't exist, insert new one
      const { data: insertData, error: insertError } = await supabase
        .from('daily_msg_api_config')
        .insert({
          config_key: key,
          config_value: value
        })
        .select()
        .single()

      if (insertError) {
        return {
          success: false,
          error: insertError.message
        }
      }

      return {
        success: true,
        value: insertData.config_value
      }
    }

    if (updateError) {
      return {
        success: false,
        error: updateError.message
      }
    }

    return {
      success: true,
      value: updateData.config_value
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function removeApiConfig(key) {
  try {
    const { error } = await supabase
      .from('daily_msg_api_config')
      .delete()
      .eq('config_key', key)

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Wassender API key functions
export async function getWassenderApiKey() {
  return getApiConfig(CONFIG_KEYS.WASSENDER_API_KEY)
}

export async function setWassenderApiKey(apiKey) {
  return setApiConfig(CONFIG_KEYS.WASSENDER_API_KEY, apiKey)
}

export async function removeWassenderApiKey() {
  return removeApiConfig(CONFIG_KEYS.WASSENDER_API_KEY)
} 