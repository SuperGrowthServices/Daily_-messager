-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to call the Edge Function via HTTP
CREATE OR REPLACE FUNCTION call_process_messages_edge_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_status integer;
  response_body text;
BEGIN
  -- Call the Edge Function via HTTP
  SELECT status, content INTO response_status, response_body
  FROM net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/process-messages',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer your-anon-key"}'::jsonb,
    body := '{}'::jsonb
  );
  
  -- Log the response
  RAISE NOTICE 'Edge Function called. Status: %, Response: %', response_status, response_body;
END;
$$;

-- Create a function that will be called by the cron job
CREATE OR REPLACE FUNCTION process_scheduled_messages_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the Edge Function
  PERFORM call_process_messages_edge_function();
END;
$$;

-- Schedule the cron job to run every minute
SELECT cron.schedule(
  'process-scheduled-messages',
  '* * * * *', -- Every minute
  'SELECT process_scheduled_messages_cron();'
);

-- Alternative: Create a database function that processes messages directly
-- This is a backup approach if Edge Functions don't work
CREATE OR REPLACE FUNCTION process_scheduled_messages_direct()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_record RECORD;
  wasender_api_key text;
  response_status integer;
  response_body text;
BEGIN
  -- Get Wasender API key from settings
  SELECT api_key INTO wasender_api_key 
  FROM daily_msg_wasender_sessions 
  LIMIT 1;
  
  IF wasender_api_key IS NULL THEN
    RAISE NOTICE 'No Wasender API key found';
    RETURN;
  END IF;
  
  -- Process pending messages that are due
  FOR message_record IN 
    SELECT 
      sm.id,
      sm.campaign_id,
      sm.user_id,
      sm.template_id,
      sm.scheduled_time,
      u.whatsapp_number,
      t.content as template_content,
      u.name as user_name
    FROM daily_msg_scheduled_messages sm
    JOIN daily_msg_users u ON sm.user_id = u.id
    JOIN daily_msg_templates t ON sm.template_id = t.id
    WHERE sm.status = 'pending' 
    AND sm.scheduled_time <= NOW()
    ORDER BY sm.scheduled_time
    LIMIT 10
  LOOP
    BEGIN
      -- Send message via Wasender API
      SELECT status, content INTO response_status, response_body
      FROM net.http_post(
        url := 'https://wasenderapi.com/api/send-message',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || wasender_api_key,
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'to', message_record.whatsapp_number,
          'text', message_record.template_content
        )
      );
      
      -- Update message status based on response
      IF response_status = 200 THEN
        -- Success
        UPDATE daily_msg_scheduled_messages 
        SET status = 'sent', sent_time = NOW(), updated_at = NOW()
        WHERE id = message_record.id;
        
        -- Log the message
        INSERT INTO daily_msg_message_logs (
          campaign_id, user_id, template_id, status, 
          recipient_phone, message_content, sent_time
        ) VALUES (
          message_record.campaign_id, message_record.user_id, 
          message_record.template_id, 'sent',
          message_record.whatsapp_number, message_record.template_content, NOW()
        );
        
        RAISE NOTICE 'Message sent successfully to %', message_record.user_name;
      ELSE
        -- Failed
        UPDATE daily_msg_scheduled_messages 
        SET status = 'failed', error_message = response_body, updated_at = NOW()
        WHERE id = message_record.id;
        
        RAISE NOTICE 'Failed to send message to %: %', message_record.user_name, response_body;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Handle errors
      UPDATE daily_msg_scheduled_messages 
      SET status = 'failed', error_message = SQLERRM, updated_at = NOW()
      WHERE id = message_record.id;
      
      RAISE NOTICE 'Error processing message for %: %', message_record.user_name, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- Schedule the direct processing function as a backup
SELECT cron.schedule(
  'process-scheduled-messages-direct',
  '* * * * *', -- Every minute
  'SELECT process_scheduled_messages_direct();'
);

-- Create a view to monitor scheduled messages
CREATE OR REPLACE VIEW scheduled_messages_status AS
SELECT 
  sm.id,
  sm.scheduled_time,
  sm.status,
  sm.sent_time,
  sm.error_message,
  u.name as user_name,
  u.whatsapp_number,
  t.content as template_content,
  c.name as campaign_name
FROM daily_msg_scheduled_messages sm
JOIN daily_msg_users u ON sm.user_id = u.id
JOIN daily_msg_templates t ON sm.template_id = t.id
LEFT JOIN daily_msg_campaigns c ON sm.campaign_id = c.id
ORDER BY sm.scheduled_time DESC;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_scheduled_messages_cron() TO authenticated;
GRANT EXECUTE ON FUNCTION process_scheduled_messages_direct() TO authenticated;
GRANT SELECT ON scheduled_messages_status TO authenticated; 