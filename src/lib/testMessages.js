import { supabase } from './supabase'
import { sendWhatsAppMessage } from './wasender'
import { getTemplatesByGroup } from './templates'

// Test message sending function
export async function sendTestMessages(campaignData) {
  try {
    console.log('🚀 Starting test message sending...', campaignData)
    
    // Get users based on filter
    const users = await getTargetUsers(campaignData.userTypeFilter)
    console.log(`📊 Found ${users.length} users for testing`)
    
    if (users.length === 0) {
      return { success: false, error: 'No users found for this campaign' }
    }

    // Get templates from the selected group
    const templates = await getTemplatesByGroup(campaignData.templateGroupId)
    console.log(`📝 Found ${templates.length} templates in group`)
    
    if (templates.length === 0) {
      return { success: false, error: 'No templates found in the selected group' }
    }

    // Send test messages to all users
    const results = []
    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)]
      
      if (!randomTemplate) {
        console.warn(`⚠️ No template found for user ${user.id}`)
        failureCount++
        continue
      }

      // Replace template variables
      const messageContent = replaceTemplateVariables(randomTemplate.content, user)
      
      console.log(`📤 Sending test message ${i + 1}/${users.length} to ${user.name} (${user.whatsapp_number})`)
      console.log(`📄 Template: ${randomTemplate.content}`)
      console.log(`📝 Final message: ${messageContent}`)

      try {
        // Send message via Wasender API
        const result = await sendWhatsAppMessage(user.whatsapp_number, messageContent)
        
        if (result.success) {
          console.log(`✅ Message sent successfully to ${user.name}`)
          successCount++
          
          // Log to database
          await logTestMessage(user, randomTemplate, messageContent, result)
        } else {
          console.error(`❌ Failed to send message to ${user.name}:`, result.error)
          failureCount++
          
          // Log error to database
          await logTestMessage(user, randomTemplate, messageContent, result)
        }
        
        results.push({
          user,
          template: randomTemplate,
          message: messageContent,
          result
        })

        // Add a small delay between messages to avoid rate limiting
        if (i < users.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
      } catch (error) {
        console.error(`❌ Error sending message to ${user.name}:`, error)
        failureCount++
        
        // Log error to database
        await logTestMessage(user, randomTemplate, messageContent, { success: false, error: error.message })
      }
    }

    console.log(`📊 Test completed: ${successCount} successful, ${failureCount} failed`)
    
    return {
      success: true,
      totalUsers: users.length,
      successCount,
      failureCount,
      results
    }
    
  } catch (error) {
    console.error('❌ Error in sendTestMessages:', error)
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

function replaceTemplateVariables(content, user) {
  return content
    .replace(/\{name\}/g, user.name || 'User')
    .replace(/\{businessName\}/g, user.business_name || 'Business')
    .replace(/\{Name\}/g, user.name || 'User')
    .replace(/\{Business\}/g, user.business_name || 'Business')
    .replace(/\{User\}/g, user.name || 'User')
}

async function logTestMessage(user, template, messageContent, result) {
  try {
    await supabase
      .from('daily_msg_message_logs')
      .insert({
        campaign_id: null, // Test messages don't have a campaign
        user_id: user.id,
        template_id: template.id,
        wasender_message_id: result.data?.id,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error,
        recipient_phone: user.whatsapp_number,
        message_content: messageContent,
        is_test_message: true
      })
  } catch (error) {
    console.error('Error logging test message:', error)
  }
} 