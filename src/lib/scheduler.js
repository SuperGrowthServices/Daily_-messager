import { supabase } from './supabase'
import { sendWhatsAppMessage } from './wasender'
import { getTemplatesByGroup } from './templates'
import { getUsers } from './users'
import { parse, set, startOfDay, addMinutes, addSeconds, isBefore, isAfter, differenceInMinutes } from 'date-fns'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

// Scheduler Functions
export async function scheduleCampaignMessages(campaignId) {
  try {
    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('daily_msg_campaigns_with_details')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      console.error('Error fetching campaign:', campaignError)
      return { success: false, error: 'Campaign not found' }
    }

    // Get users based on filter
    const users = await getTargetUsers(campaign.user_type_filter)
    if (users.length === 0) {
      return { success: false, error: 'No users found for this campaign' }
    }

    // Get templates from the selected group
    const templates = await getTemplatesByGroup(campaign.template_group_id)
    if (templates.length === 0) {
      return { success: false, error: 'No templates found in the selected group' }
    }

    // Parse schedule data
    const scheduleData = typeof campaign.schedule_data === 'string' 
      ? JSON.parse(campaign.schedule_data) 
      : campaign.schedule_data

    // Get scheduler settings
    const { data: schedulerSettings } = await supabase
      .from('daily_msg_scheduler_settings')
      .select('*')
      .single()

    // Generate scheduled messages
    const scheduledMessages = await generateScheduledMessages(
      campaign,
      users,
      templates,
      scheduleData,
      schedulerSettings
    )

    // Insert scheduled messages into queue
    const { error: insertError } = await supabase
      .from('daily_msg_scheduled_messages')
      .insert(scheduledMessages)

    if (insertError) {
      console.error('Error inserting scheduled messages:', insertError)
      return { success: false, error: insertError.message }
    }

    // Update campaign status to scheduled
    await supabase
      .from('daily_msg_campaigns')
      .update({ status: 'scheduled' })
      .eq('id', campaignId)

    return { 
      success: true, 
      messageCount: scheduledMessages.length,
      scheduledTime: scheduleData.timeWindow
    }
  } catch (error) {
    console.error('Error scheduling campaign messages:', error)
    return { success: false, error: error.message }
  }
}

async function getTargetUsers(userTypeFilter) {
  try {
    let query = supabase.from('daily_msg_users').select('*')

    if (userTypeFilter !== 'all') {
      // Get user type ID
      const { data: userType } = await supabase
        .from('daily_msg_user_types')
        .select('id')
        .eq('name', userTypeFilter)
        .single()

      if (userType) {
        query = query.eq('user_type_id', userType.id)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching target users:', error)
    return []
  }
}

async function generateScheduledMessages(campaign, users, templates, scheduleData, schedulerSettings) {
  const now = new Date()
  const nowInDubai = utcToZonedTime(now, scheduleData.timezone)
  
  // Use startOfDay(nowInDubai) as the reference date for parsing.
  // This ensures that 'HH:mm:ss' strings are interpreted as times in the Dubai timezone.
  const referenceDateForParsing = startOfDay(nowInDubai)
  
  // Access time window from scheduleData, not campaign directly
  const timeWindow = scheduleData.timeWindow
  const campaignStartTime = parse(timeWindow.start, 'HH:mm', referenceDateForParsing)
  const campaignEndTime = parse(timeWindow.end, 'HH:mm', referenceDateForParsing)
  
  // These are now Date objects representing the correct time in the Dubai timezone for the current day.
  const startDateTimeDubai = campaignStartTime
  const endDateTimeDubai = campaignEndTime

  const scheduledMessages = []
  const totalUsers = users.length
  if (totalUsers === 0) return []

  const timeWindowMinutes = differenceInMinutes(endDateTimeDubai, startDateTimeDubai)
  if (timeWindowMinutes <= 0) {
    console.error("Invalid or zero-length time window for campaign:", campaign.id, "Start:", timeWindow.start, "End:", timeWindow.end)
    return [] // No messages can be scheduled in an invalid or zero-length window
  }

  const minIntervalSeconds = schedulerSettings?.min_interval_seconds || 10
  
  const effectiveIntervalSeconds = Math.max(
    minIntervalSeconds,
    (timeWindowMinutes * 60) / totalUsers
  )

  for (let i = 0; i < totalUsers; i++) {
    const user = users[i]
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)]
    
    if (!randomTemplate) {
      console.warn(`No template found for group ${campaign.template_group_id}. Skipping message for user ${user.id}`)
      continue
    }

    const messageContent = replaceTemplateVariables(randomTemplate.content, user)
    
    const baseOffsetSeconds = i * effectiveIntervalSeconds
    const jitter = (Math.random() - 0.5) * (effectiveIntervalSeconds * 0.5)
    const finalOffsetSeconds = Math.max(0, baseOffsetSeconds + jitter)
    
    let slotTime = addSeconds(startDateTimeDubai, finalOffsetSeconds)
    
    if (isAfter(slotTime, endDateTimeDubai)) {
      slotTime = endDateTimeDubai
    }
    
    const scheduledTimeUtc = zonedTimeToUtc(slotTime, scheduleData.timezone)
    
    scheduledMessages.push({
      campaign_id: campaign.id,
      user_id: user.id,
      template_id: randomTemplate.id,
      scheduled_time: scheduledTimeUtc.toISOString(),
      status: 'pending'
    })
  }

  return scheduledMessages
}



function replaceTemplateVariables(content, user) {
  return content
    .replace(/\{name\}/g, user.name || 'User')
    .replace(/\{businessName\}/g, user.business_name || 'Business')
    .replace(/\{Name\}/g, user.name || 'User')
    .replace(/\{Business\}/g, user.business_name || 'Business')
    .replace(/\{User\}/g, user.name || 'User')
}



// Message Processing Functions
export async function processScheduledMessages() {
  try {
    const now = new Date()
    const tenSecondsAgo = new Date(now.getTime() - 10000) // 10 seconds ago

    // Get pending messages that are due
    const { data: pendingMessages, error } = await supabase
      .from('daily_msg_scheduled_messages_with_details')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_time', now.toISOString())
      .order('scheduled_time', { ascending: true })
      .limit(1) // Process one at a time

    if (error) {
      console.error('Error fetching pending messages:', error)
      return { success: false, error: error.message }
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      return { success: true, processed: 0 }
    }

    const message = pendingMessages[0]

    // Check if we're within the time window
    const campaign = await getCampaignWithSchedule(message.campaign_id)
    if (!isWithinTimeWindow(campaign, now)) {
      // Pause campaign if outside time window
      await pauseCampaign(message.campaign_id, 'Outside scheduled time window')
      return { success: false, error: 'Outside scheduled time window' }
    }

    // Send the message
    const result = await sendScheduledMessage(message)

    // Update message status
    await updateMessageStatus(message.id, result.success ? 'sent' : 'failed', result.error)

    // Log the message
    await logMessage(message, result)

    return { success: true, processed: 1, messageResult: result }
  } catch (error) {
    console.error('Error processing scheduled messages:', error)
    return { success: false, error: error.message }
  }
}

async function sendScheduledMessage(message) {
  try {
    // Send message via Wasender API using the simple approach
    const result = await sendWhatsAppMessage(message.user_phone, message.template_content)
    return result
  } catch (error) {
    console.error('Error sending scheduled message:', error)
    return { success: false, error: error.message }
  }
}

async function getCampaignWithSchedule(campaignId) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (error) {
      console.error('Error fetching campaign:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return null
  }
}

function isWithinTimeWindow(campaign, now) {
  if (!campaign || !campaign.schedule_data) return false

  try {
    const scheduleData = typeof campaign.schedule_data === 'string' 
      ? JSON.parse(campaign.schedule_data) 
      : campaign.schedule_data

    const timeWindow = scheduleData.timeWindow
    const timezone = scheduleData.timezone || 'Asia/Dubai'

    // Convert current time to campaign timezone
    const campaignTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    const currentTime = campaignTime.toTimeString().slice(0, 5) // HH:MM format

    return currentTime >= timeWindow.start && currentTime <= timeWindow.end
  } catch (error) {
    console.error('Error checking time window:', error)
    return false
  }
}

async function pauseCampaign(campaignId, reason) {
  try {
    await supabase
      .from('daily_msg_campaigns')
      .update({ 
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    console.log(`Campaign ${campaignId} paused: ${reason}`)
  } catch (error) {
    console.error('Error pausing campaign:', error)
  }
}

async function updateMessageStatus(messageId, status, errorMessage = null) {
  try {
    await supabase
      .from('daily_msg_scheduled_messages')
      .update({
        status,
        error_message: errorMessage,
        sent_time: status === 'sent' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
  } catch (error) {
    console.error('Error updating message status:', error)
  }
}

async function logMessage(message, result) {
  try {
    await supabase
      .from('daily_msg_message_logs')
      .insert({
        campaign_id: message.campaign_id,
        user_id: message.user_id,
        template_id: message.template_id,
        wasender_message_id: result.data?.id,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error,
        recipient_phone: message.user_phone,
        message_content: message.template_content
      })
  } catch (error) {
    console.error('Error logging message:', error)
  }
}

// Utility Functions
export async function getScheduledMessagesForNext24Hours() {
  try {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('daily_msg_scheduled_messages_with_details')
      .select('*')
      .gte('scheduled_time', now.toISOString())
      .lt('scheduled_time', tomorrow.toISOString())
      .order('scheduled_time', { ascending: true })

    if (error) {
      console.error('Error fetching scheduled messages:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching scheduled messages:', error)
    return []
  }
}

export async function getMessageLogs(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('daily_msg_message_logs_with_details')
      .select('*')
      .order('sent_time', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching message logs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching message logs:', error)
    return []
  }
} 