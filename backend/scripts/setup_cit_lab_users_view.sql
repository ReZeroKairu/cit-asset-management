-- =============================================
-- CIT Lab Users Logs View Creation Script
-- =============================================
-- Run this script in your MySQL database to create the optimized views
-- for CIT Lab Users logs with enhanced performance and analytics capabilities
-- =============================================

-- Source the view creation script
SOURCE backend/sql/cit_lab_users_logs_view.sql;

-- =============================================
-- Verify View Creation
-- =============================================

-- Check if the main view was created successfully
SELECT TABLE_NAME, TABLE_COMMENT 
FROM INFORMATION_SCHEMA.VIEWS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME LIKE '%cit_lab_users_logs%';

-- Test the main view with a sample query
SELECT COUNT(*) as total_records FROM cit_lab_users_logs_view;

-- Test the recent logs view
SELECT COUNT(*) as recent_records FROM recent_cit_lab_users_logs_view;

-- =============================================
-- Create Performance Indexes (Optional but Recommended)
-- =============================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cit_lab_logs_created_at ON cit_lab_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_cit_lab_logs_date ON cit_lab_logs(date);
CREATE INDEX IF NOT EXISTS idx_cit_lab_logs_laboratory ON cit_lab_logs(laboratory);
CREATE INDEX IF NOT EXISTS idx_cit_lab_logs_user_type ON cit_lab_logs(user_type);
CREATE INDEX IF NOT EXISTS idx_cit_lab_logs_usage_type ON cit_lab_logs(usage_type);
CREATE INDEX IF NOT EXISTS idx_cit_lab_logs_faculty_name ON cit_lab_logs(faculty_student_name);

-- =============================================
-- Sample Queries for Testing
-- =============================================

-- Test basic query
SELECT 
  log_id,
  faculty_student_name,
  laboratory_display,
  usage_type_display,
  formatted_created_timestamp
FROM cit_lab_users_logs_view 
ORDER BY created_at DESC 
LIMIT 5;

-- Test analytics
SELECT 
  laboratory_display,
  COUNT(*) as total_logs,
  COUNT(DISTINCT faculty_student_name) as unique_users
FROM cit_lab_users_logs_view 
GROUP BY laboratory_display 
ORDER BY total_logs DESC;

-- Test date filtering
SELECT 
  DATE(date) as log_date,
  COUNT(*) as daily_count
FROM cit_lab_users_logs_view 
WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATE(date)
ORDER BY log_date DESC;

SELECT 'CIT Lab Users Logs View Setup Complete!' as status;
