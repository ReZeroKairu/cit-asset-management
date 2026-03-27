-- =============================================
-- NAVICAT: Complete Database Views Setup
-- =============================================
-- Ready to run in Navicat - Drops all old views and creates 3 essential ones
-- =============================================

-- =============================================
-- STEP 1: DROP ALL OLD VIEWS (Clean Slate)
-- =============================================

-- Drop Audit Views
DROP VIEW IF EXISTS audit_logs_view;
DROP VIEW IF EXISTS recent_audit_logs_view;
DROP VIEW IF EXISTS user_audit_logs_view;
DROP VIEW IF EXISTS system_audit_logs_view;
DROP VIEW IF EXISTS high_priority_audit_logs_view;

-- Drop CIT Lab Users Views
DROP VIEW IF EXISTS cit_lab_users_logs_view;
DROP VIEW IF EXISTS recent_cit_lab_users_logs_view;
DROP VIEW IF EXISTS today_cit_lab_users_logs_view;
DROP VIEW IF EXISTS student_cit_lab_users_logs_view;
DROP VIEW IF EXISTS faculty_cit_lab_users_logs_view;
DROP VIEW IF EXISTS printing_cit_lab_users_logs_view;
DROP VIEW IF EXISTS lab_usage_cit_lab_users_logs_view;
DROP VIEW IF EXISTS high_priority_cit_lab_users_logs_view;

-- Drop Asset Lifecycle Views
DROP VIEW IF EXISTS asset_lifecycle_timeline_view;
DROP VIEW IF EXISTS asset_lifecycle_by_stage_view;
DROP VIEW IF EXISTS aging_assets_view;
DROP VIEW IF EXISTS unassigned_assets_view;
DROP VIEW IF EXISTS assets_by_workstation_view;
DROP VIEW IF EXISTS assets_by_lab_view;

-- =============================================
-- STEP 2: CREATE 3 ESSENTIAL VIEWS ONLY
-- =============================================

-- Essential View 1: Audit Logs View
CREATE OR REPLACE VIEW audit_logs_view AS
SELECT 
    al.id,
    al.user_id,
    al.action,
    al.description,
    al.created_at,
    DATE(al.created_at) AS log_date,
    TIME(al.created_at) AS log_time,
    DATE_FORMAT(al.created_at, '%Y-%m-%d %h:%i:%s %p') AS formatted_timestamp,
    DATE_FORMAT(al.created_at, '%M %d, %Y') AS formatted_date,
    DATE_FORMAT(al.created_at, '%h:%i:%s %p') AS formatted_time,
    COALESCE(u.full_name, 'System') AS user_name,
    COALESCE(u.email, 'system@cit.edu') AS user_email,
    COALESCE(u.role, 'System') AS user_role,
    COALESCE(l.lab_name, 'N/A') AS user_lab_name,
    COALESCE(l.location, 'N/A') AS user_lab_location,
    CASE 
        WHEN al.ip_address IS NOT NULL AND al.ip_address != '' THEN al.ip_address
        ELSE 'Unknown'
    END AS ip_address_display,
    CASE 
        WHEN al.user_id IS NULL THEN 'System'
        WHEN u.role = 'Admin' THEN 'Administrator'
        WHEN u.role = 'Custodian' THEN 'Custodian'
        ELSE 'Unknown'
    END AS user_type,
    CASE 
        WHEN al.action IN ('CREATE', 'UPDATE', 'DELETE') THEN 'CRUD Operation'
        WHEN al.action IN ('LOGIN', 'LOGOUT') THEN 'Authentication'
        WHEN al.action IN ('GENERATE', 'VALIDATE') THEN 'Token Management'
        WHEN al.action IN ('SUBMIT', 'APPROVE', 'DENY') THEN 'Form Processing'
        ELSE 'Other'
    END AS action_category,
    CONCAT(
        COALESCE(al.action, ''), ' ',
        COALESCE(al.description, ''), ' ',
        COALESCE(u.full_name, ''), ' ',
        COALESCE(u.email, ''), ' ',
        COALESCE(l.lab_name, '')
    ) AS searchable_text
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.user_id
LEFT JOIN laboratories l ON u.lab_id = l.lab_id;

-- Essential View 2: CIT Lab Users Logs View
CREATE OR REPLACE VIEW cit_lab_users_logs_view AS
SELECT 
    cll.log_id,
    cll.date,
    cll.usage_type,
    cll.faculty_student_name,
    cll.year_level,
    cll.laboratory,
    cll.printing_pages,
    cll.ws_number,
    cll.purpose,
    cll.monitored_by,
    cll.user_type,
    cll.ip_address,
    cll.created_at,
    DATE(cll.date) AS log_date,
    TIME(cll.created_at) AS log_time,
    DATE_FORMAT(cll.date, '%Y-%m-%d') AS formatted_date,
    DATE_FORMAT(cll.created_at, '%Y-%m-%d %h:%i:%s %p') AS formatted_timestamp,
    DATE_FORMAT(cll.created_at, '%M %d, %Y') AS formatted_created_date,
    DATE_FORMAT(cll.created_at, '%h:%i:%s %p') AS formatted_created_time,
    DAYOFWEEK(cll.date) AS day_of_week,
    MONTHNAME(cll.date) AS month_name,
    HOUR(cll.created_at) AS time_of_day,
    CASE 
        WHEN cll.usage_type = 'set-in-reservation' THEN 'Set-in/Reservation'
        WHEN cll.usage_type = 'printing' THEN 'Printing'
        ELSE COALESCE(cll.usage_type, 'Unknown')
    END AS usage_type_display,
    CASE 
        WHEN cll.user_type = 'Student' THEN 'Student'
        WHEN cll.user_type = 'Faculty' THEN 'Faculty'
        ELSE COALESCE(cll.user_type, 'Unknown')
    END AS user_type_category,
    CASE 
        WHEN cll.laboratory = 'e-forum' THEN 'E-Forum'
        ELSE COALESCE(cll.laboratory, 'Unknown Lab')
    END AS laboratory_display,
    CONCAT(
        COALESCE(cll.faculty_student_name, ''), ' ',
        COALESCE(cll.usage_type, ''), ' ',
        COALESCE(cll.laboratory, ''), ' ',
        COALESCE(cll.purpose, '')
    ) AS searchable_text
FROM cit_lab_logs cll;

-- Essential View 3: Asset Lifecycle Timeline View
CREATE OR REPLACE VIEW asset_lifecycle_timeline_view AS
SELECT 
    ia.asset_id,
    COALESCE(ad.property_tag_no, 'N/A') AS property_tag_no,
    COALESCE(ad.serial_number, 'N/A') AS serial_number,
    COALESCE(ad.description, 'N/A') AS description,
    COALESCE(ad.quantity, 1) AS quantity,
    COALESCE(ad.asset_remarks, 'N/A') AS asset_remarks,
    CASE 
        WHEN ad.date_of_purchase IS NOT NULL THEN 
            TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE())
        ELSE 0
    END AS current_age_years,
    CASE 
        WHEN ad.date_of_purchase IS NOT NULL THEN 
            TIMESTAMPDIFF(MONTH, ad.date_of_purchase, CURDATE())
        ELSE 0
    END AS current_age_months,
    CASE 
        WHEN ad.date_of_purchase IS NOT NULL THEN 
            DATEDIFF(CURDATE(), ad.date_of_purchase)
        ELSE 0
    END AS current_age_days,
    CASE 
        WHEN ad.date_of_purchase IS NULL THEN 0
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 0 THEN 0
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 1 THEN 1
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 2 THEN 2
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 3 THEN 3
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 4 THEN 4
        ELSE 5
    END AS timeline_position,
    CASE 
        WHEN ad.date_of_purchase IS NULL THEN 'Unknown'
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 0 THEN 'New (Y1)'
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 1 THEN 'Good (Y1)'
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 2 THEN 'Fair (Y2)'
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 3 THEN 'Replace Soon (Y3)'
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 4 THEN 'Replace Now (Y4)'
        ELSE 'Overdue (Y5+)'
    END AS lifecycle_stage,
    CASE 
        WHEN ad.date_of_purchase IS NULL THEN 'Unknown Status'
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) <= 1 THEN 'Good'
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) <= 3 THEN 'Monitor'
        ELSE 'Replace'
    END AS lifecycle_status,
    COALESCE(ad.date_of_purchase, ia.date_added) AS effective_date,
    ia.date_added,
    ad.status_id,
    COALESCE(ast.status_name, 'Unknown') AS status_name,
    ia.workstation_id,
    COALESCE(ws.workstation_name, 'Unassigned') AS workstation_name,
    ws.lab_id,
    COALESCE(l.lab_name, 'Unassigned') AS lab_name,
    COALESCE(l.location, 'Unknown') AS lab_location,
    COALESCE(u.unit_name, 'Unknown') AS unit_name,
    CASE 
        WHEN ws.workstation_id IS NOT NULL THEN 'Assigned'
        ELSE 'Unassigned'
    END AS assignment_status,
    CONCAT(
        COALESCE(ad.property_tag_no, ''), ' ',
        COALESCE(ad.description, ''), ' ',
        COALESCE(ad.serial_number, ''), ' ',
        COALESCE(ws.workstation_name, ''), ' ',
        COALESCE(l.lab_name, '')
    ) AS searchable_text
FROM inventory_assets ia
LEFT JOIN asset_details ad ON ia.asset_id = ad.asset_id
LEFT JOIN asset_statuses ast ON ad.status_id = ast.status_id
LEFT JOIN workstations ws ON ia.workstation_id = ws.workstation_id
LEFT JOIN laboratories l ON ws.lab_id = l.lab_id
LEFT JOIN units u ON ia.unit_id = u.unit_id;

-- =============================================
-- STEP 3: VERIFICATION
-- =============================================

-- Check that views were created successfully
SELECT 
    'Verification Results' as status,
    COUNT(*) as total_views_created
FROM information_schema.views 
WHERE table_name IN ('audit_logs_view', 'cit_lab_users_logs_view', 'asset_lifecycle_timeline_view') 
AND table_schema = DATABASE();

-- Show the created views
SELECT 
    table_name as view_name,
    'Created Successfully' as status
FROM information_schema.views 
WHERE table_name IN ('audit_logs_view', 'cit_lab_users_logs_view', 'asset_lifecycle_timeline_view') 
AND table_schema = DATABASE()
ORDER BY table_name;

-- =============================================
-- STEP 4: SAMPLE QUERIES (For Testing)
-- =============================================

-- Test Audit Logs View
SELECT 'Testing Audit Logs View' as test_name, COUNT(*) as record_count FROM audit_logs_view LIMIT 1;

-- Test CIT Lab Users View  
SELECT 'Testing CIT Lab Users View' as test_name, COUNT(*) as record_count FROM cit_lab_users_logs_view LIMIT 1;

-- Test Asset Lifecycle View
SELECT 'Testing Asset Lifecycle View' as test_name, COUNT(*) as record_count FROM asset_lifecycle_timeline_view LIMIT 1;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
SELECT 
    '🎉 SETUP COMPLETE!' as status,
    '3 essential views created successfully' as result,
    'Ready to update backend code with filtered queries' as next_step;
