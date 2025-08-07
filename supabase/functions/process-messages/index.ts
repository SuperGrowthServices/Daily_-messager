import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔄 Starting automatic message processing...')

    // Get current time
    const now = new Date()
    console.log(`⏰ Current time: ${now.toISOString()}`)

    // Get pending messages that are due
    const { data: pendingMessages, error } = await supabase
      .from('daily_msg_scheduled_messages_with_details')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_time', now.toISOString())
      .order('scheduled_time', { ascending: true })
      .limit(10) // Process up to 10 messages at a time

    if (error) {
      console.error('❌ Error fetching pending messages:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      console.log('✅ No pending messages to process')
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No pending messages' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📨 Found ${pendingMessages.length} pending messages to process`)

    let processedCount = 0
    let successCount = 0
    let failureCount = 0

    // Process each pending message
    for (const message of pendingMessages) {
      try {
        console.log(`📤 Processing message ${processedCount + 1}/${pendingMessages.length}`)
        console.log(`👤 Recipient: ${message.user_name} (${message.user_phone})`)
        console.log(`📝 Template: ${message.template_content}`)

        // Check if we're within the time window
        const campaign = await getCampaignWithSchedule(supabase, message.campaign_id)
        if (!isWithinTimeWindow(campaign, now)) {
          console.log(`⏰ Outside time window for campaign ${message.campaign_id}`)
          
          // Pause campaign if outside time window
          await pauseCampaign(supabase, message.campaign_id, 'Outside scheduled time window')
          
          // Update message status
          await updateMessageStatus(supabase, message.id, 'failed', 'Outside scheduled time window')
          
          failureCount++
          processedCount++
          continue
        }

        // Send the message via Wasender API
        const result = await sendScheduledMessage(message)

        // Update message status
        await updateMessageStatus(supabase, message.id, result.success ? 'sent' : 'failed', result.error)

        // Log the message
        await logMessage(supabase, message, result)

        if (result.success) {
          console.log(`✅ Message sent successfully to ${message.user_name}`)
          successCount++
        } else {
          console.error(`❌ Failed to send message to ${message.user_name}:`, result.error)
          failureCount++
        }

        processedCount++

        // Add a small delay between messages to avoid rate limiting
        if (processedCount < pendingMessages.length) {
          await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
        }

      } catch (error) {
        console.error(`❌ Error processing message for ${message.user_name}:`, error)
        
        // Update message status to failed
        await updateMessageStatus(supabase, message.id, 'failed', error.message)
        
        failureCount++
        processedCount++
      }
    }

    console.log(`📊 Processing completed: ${successCount} successful, ${failureCount} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        successful: successCount,
        failed: failureCount,
        message: `Processed ${processedCount} messages (${successCount} successful, ${failureCount} failed)`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in process-messages function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper functions
async function getCampaignWithSchedule(supabase: any, campaignId: string) {
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

function isWithinTimeWindow(campaign: any, now: Date) {
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

async function pauseCampaign(supabase: any, campaignId: string, reason: string) {
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

async function updateMessageStatus(supabase: any, messageId: string, status: string, errorMessage: string | null = null) {
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

async function sendScheduledMessage(message: any) {
  try {
    // Get Wasender API key from environment
    const wasenderApiKey = Deno.env.get('WASSENDER_API_KEY')
    
    if (!wasenderApiKey) {
      return { success: false, error: 'Wasender API key not configured' }
    }

    // Send message via Wasender API
    const response = await fetch('https://wasenderapi.com/api/send-message', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${wasenderApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: message.user_phone,
        text: message.template_content
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { 
        success: false, 
        error: errorData.message || `HTTP ${response.status}` 
      }
    }

    const result = await response.json()
    return { 
      success: true, 
      data: result,
      messageId: result.id || `msg_${Date.now()}`
    }

  } catch (error) {
    console.error('Error sending scheduled message:', error)
    return { success: false, error: error.message }
  }
}

async function logMessage(supabase: any, message: any, result: any) {
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