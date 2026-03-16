-- Test if CIT Lab Users view exists and works
-- Run this in Navicat to debug the issue

-- 1. Check if view exists (compatible with all MySQL versions)
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.VIEWS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME LIKE '%cit_lab%';

-- 2. Alternative: Show all tables and look for views manually
SHOW FULL TABLES WHERE TABLE_TYPE LIKE 'VIEW%';

-- 3. Test the view structure (if it exists)
DESCRIBE cit_lab_users_logs_view;

-- 4. Test basic query (should return at least 1 row if data exists)
SELECT COUNT(*) as total_records FROM cit_lab_users_logs_view LIMIT 1;

-- 5. Test query with specific fields (what the controller expects)
SELECT 
  log_id,
  date,
  usage_type,
  faculty_student_name,
  ip_address,
  ip_address_display
FROM cit_lab_users_logs_view 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. If view doesn't work, test raw table
SELECT COUNT(*) as total_records FROM cit_lab_logs LIMIT 1;

-- 7. Test raw table structure
DESCRIBE cit_lab_logs;

-- 8. Test raw table has IP address field
SELECT ip_address FROM cit_lab_logs LIMIT 5;
