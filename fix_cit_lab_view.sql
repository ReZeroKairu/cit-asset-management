-- Fix the corrupted CIT Lab Users view
-- Run this to drop and recreate the view correctly

-- 1. Drop all the corrupted views
DROP VIEW IF EXISTS cit_lab_users_logs_view;
DROP VIEW IF EXISTS recent_cit_lab_users_logs_view;
DROP VIEW IF EXISTS today_cit_lab_users_logs_view;
DROP VIEW IF EXISTS student_cit_lab_users_logs_view;
DROP VIEW IF EXISTS faculty_cit_lab_users_logs_view;
DROP VIEW IF EXISTS printing_cit_lab_users_logs_view;
DROP VIEW IF EXISTS lab_usage_cit_lab_users_logs_view;
DROP VIEW IF EXISTS high_priority_cit_lab_users_logs_view;

-- 2. Test raw table first to make sure it's correct
SELECT 
  log_id,
  date,
  usage_type,
  faculty_student_name,
  year_level,
  laboratory,
  printing_pages,
  ws_number,
  purpose,
  monitored_by,
  user_type,
  ip_address,
  created_at
FROM cit_lab_logs 
ORDER BY created_at DESC 
LIMIT 3;

-- If raw table works, then run the full cit_lab_users_logs_view.sql script
-- to recreate all views properly
