-- Enable the pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION call_process_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will be called by the cron job
  -- The actual processing is done by the Edge Function
  -- We just need a placeholder function for the cron job
  PERFORM 1;
END;
$$;

-- Schedule the cron job to run every minute
SELECT cron.schedule(
  'process-scheduled-messages',
  '* * * * *', -- Every minute
  'SELECT call_process_messages();'
);

-- Alternative: If you want to call the Edge Function directly via HTTP
-- You can use pg_net extension (if available) to make HTTP calls
-- This is more complex but would directly trigger the Edge Function

-- Note: The Edge Function will be called automatically by Supabase's cron system
-- when deployed, so this SQL is mainly for reference 