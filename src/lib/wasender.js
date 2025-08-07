import axios from 'axios'
import { supabase } from './supabase'
import { getApiKeyFromSupabase, setApiKeyToSupabase, removeApiKeyFromSupabase } from './config'

const CONFIG = {
  WASSENDER_API_BASE: 'https://wasenderapi.com/api',
}

// Message Types
export const MessageTypes = {
  TEXT: 'text',
  IMAGE: 'image',
}

// Enhanced message sending with retry logic
export async function sendMessageWithRetry(payload, retryAttempts = 3) {
  const apiKey = await getApiKeyFromSupabase()
  
  if (!apiKey) {
    return {
      success: false,
      error: 'API key not found. Please set your Wassender API key.'
    }
  }

  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      const response = await axios.post(`${CONFIG.WASSENDER_API_BASE}/send-message`, payload, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      })
      
      return {
        success: true,
        data: response.data,
        messageId: response.data?.id || `msg_${Date.now()}`,
      }
    } catch (error) {
      // Don't retry on certain errors
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Invalid API key. Please check your Wassender API credentials.',
          retryCount: attempt
        }
      }
      
      if (error.response?.status === 429) {
        // Rate limit hit - wait longer before retry
        const waitTime = Math.min(attempt * 30, 300) // Max 5 minutes
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
        continue
      }
      
      if (attempt === retryAttempts) {
        return {
          success: false,
          error: error.response?.data?.message || error.message || 'Unknown error',
          retryCount: attempt
        }
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  return {
    success: false,
    error: 'Max retry attempts reached',
    retryCount: retryAttempts
  }
}

// Single message sending (for form submissions)
export async function sendSingleMessage(phoneNumber, messageContent) {
  const payload = createTextMessage(phoneNumber, messageContent)
  return await sendMessageWithRetry(payload)
}

// Helper functions
export function createTextMessage(to, text) {
  return { to, text }
}

export function createImageMessage(to, imageUrl, caption) {
  return {
    to,
    image: { url: imageUrl, caption },
  }
}

export async function checkApiStatus() {
  const apiKey = await getApiKeyFromSupabase()
  if (!apiKey) {
    throw new Error('API key not found. Please set your Wassender API key.')
  }
  
  try {
    const response = await axios.get(`${CONFIG.WASSENDER_API_BASE}/status`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    })
    return response.data
  } catch (error) {
    console.error('Error checking API status:', error)
    throw error
  }
}

// Legacy function for backward compatibility
export async function sendMessage(payload) {
  const result = await sendMessageWithRetry(payload)
  if (!result.success) {
    throw new Error(result.error)
  }
  return { id: result.messageId }
}

// For compatibility with scheduler
export async function sendWhatsAppMessage(phone, content) {
  const payload = createTextMessage(phone, content)
  return await sendMessageWithRetry(payload)
}

// API Key Management Functions
export async function getWasenderSessions() {
  try {
    const apiKey = await getApiKeyFromSupabase()
    if (!apiKey) {
      return []
    }
    
    // Return a single "session" representing the API key
    return [{
      id: 'default',
      name: 'Default Session',
      api_key: apiKey,
      status: 'connected', // We'll check this when needed
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]
  } catch (error) {
    console.error('Error getting Wasender sessions:', error)
    return []
  }
}

export async function createWasenderSession(sessionData) {
  try {
    const result = await setApiKeyToSupabase(sessionData.api_key)
    return {
      success: result,
      data: {
        id: 'default',
        name: 'Default Session',
        api_key: sessionData.api_key,
        status: 'connected',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error creating Wasender session:', error)
    return { success: false, error: error.message }
  }
}

export async function updateWasenderSession(sessionId, sessionData) {
  try {
    const result = await setApiKeyToSupabase(sessionData.api_key)
    return {
      success: result,
      data: {
        id: 'default',
        name: sessionData.name || 'Default Session',
        api_key: sessionData.api_key,
        status: 'connected',
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error updating Wasender session:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteWasenderSession(sessionId) {
  try {
    const result = await removeApiKeyFromSupabase()
    return { success: result }
  } catch (error) {
    console.error('Error deleting Wasender session:', error)
    return { success: false, error: error.message }
  }
}

export async function checkWasenderStatus(sessionId) {
  try {
    const apiKey = await getApiKeyFromSupabase()
    if (!apiKey) {
      return { success: false, error: 'No API key found' }
    }
    
    const status = await checkApiStatus()
    return { success: true, data: status }
  } catch (error) {
    console.error('Error checking Wasender status:', error)
    return { success: false, error: error.message }
  }
}

// Scheduler Settings Functions
export async function getSchedulerSettings() {
  try {
    const { data, error } = await supabase
      .from('daily_msg_scheduler_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching scheduler settings:', error)
      return null
    }

    if (!data) {
      // Return default settings
      return {
        min_interval_seconds: 10,
        timezone: 'Asia/Dubai',
        auto_schedule_enabled: false,
        daily_schedule_time: '00:00'
      }
    }

    return data
  } catch (error) {
    console.error('Error fetching scheduler settings:', error)
    return null
  }
}

export async function updateSchedulerSettings(settings) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_scheduler_settings')
      .upsert(settings, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      console.error('Error updating scheduler settings:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error updating scheduler settings:', error)
    return { success: false, error: error.message }
  }
}

// Phone number utilities
export function formatPhoneNumber(phone) {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // If it starts with 0, replace with country code
  if (cleaned.startsWith('0')) {
    return '+971' + cleaned.substring(1)
  }
  
  // If it doesn't start with +, add it
  if (!cleaned.startsWith('+')) {
    return '+' + cleaned
  }
  
  return cleaned
}

export function validatePhoneNumber(phone) {
  const formatted = formatPhoneNumber(phone)
  // Basic validation - should be at least 10 digits
  return formatted.replace(/\D/g, '').length >= 10
} 