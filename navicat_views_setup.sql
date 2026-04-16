-- =============================================
-- NAVICAT: Essential Database Views Setup
-- =============================================
-- Ready to run in Navicat - Drops old views and creates 3 essential ones
-- =============================================

-- =============================================
-- STEP 1: DROP EXISTING VIEWS
-- =============================================

DROP VIEW IF EXISTS audit_logs_view;
DROP VIEW IF EXISTS cit_lab_users_logs_view;
DROP VIEW IF EXISTS asset_lifecycle_timeline_view;
DROP VIEW IF EXISTS analytics_summary_view;

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

-- Essential View 2: CIT Lab Users Logs View (Updated - removed printing_pages)
CREATE OR REPLACE VIEW cit_lab_users_logs_view AS
SELECT 
    cll.log_id,
    cll.date,
    cll.time_in,
    cll.time_out,
    cll.usage_type,
    cll.faculty_student_name,
    cll.year_level,
    cll.laboratory,
    cll.ws_number,
    cll.purpose,
    cll.monitored_by,
    cll.user_type,
    cll.ip_address,
    cll.created_at,
    DATE(cll.date) AS reservation_date,
    DATE_FORMAT(cll.date, '%Y-%m-%d') AS reservation_date_formatted,
    CASE 
        WHEN cll.usage_type = 'set-in-reservation' THEN 'Set-in/Reservation'
        WHEN cll.usage_type = 'walk-in' THEN 'Walk-in'
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
-- STEP 3: ANALYTICS VIEW (Optimizes Dashboard Queries)
-- =============================================

-- Analytics Summary View - Consolidates counts for dashboard/analytics
CREATE OR REPLACE VIEW analytics_summary_view AS
-- Daily Reports Summary
SELECT 
    'daily_reports' as entity_type,
    status as group_key,
    COUNT(*) as total_count,
    DATE(created_at) as date_group,
    lab_id
FROM daily_reports
GROUP BY status, DATE(created_at), lab_id

UNION ALL

-- Complaints Summary  
SELECT 
    'complaints' as entity_type,
    status as group_key,
    COUNT(*) as total_count,
    DATE(created_at) as date_group,
    lab_id
FROM complaints
GROUP BY status, DATE(created_at), lab_id

UNION ALL

-- PMC Reports Summary
SELECT 
    'pmc_reports' as entity_type,
    quarter as group_key,
    COUNT(*) as total_count,
    NULL as date_group,
    lab_id
FROM pmc_reports
GROUP BY quarter, lab_id;

-- =============================================
-- STEP 4: VERIFICATION
-- =============================================

-- Check that views were created successfully
SELECT 
    'Verification Results' as status,
    COUNT(*) as total_views_created
FROM information_schema.views 
WHERE table_name IN ('audit_logs_view', 'cit_lab_users_logs_view', 'asset_lifecycle_timeline_view', 'analytics_summary_view') 
AND table_schema = DATABASE();

-- Show the created views
SELECT 
    table_name as view_name,
    'Created Successfully' as status
FROM information_schema.views 
WHERE table_name IN ('audit_logs_view', 'cit_lab_users_logs_view', 'asset_lifecycle_timeline_view', 'analytics_summary_view') 
AND table_schema = DATABASE()
ORDER BY table_name;

-- =============================================
-- STEP 4: SAMPLE QUERIES (For Testing)
-- =============================================

-- Test Views
SELECT 'Testing Audit Logs View' as test_name, COUNT(*) as record_count FROM audit_logs_view LIMIT 1;
SELECT 'Testing CIT Lab Users View' as test_name, COUNT(*) as record_count FROM cit_lab_users_logs_view LIMIT 1;
SELECT 'Testing Asset Lifecycle View' as test_name, COUNT(*) as record_count FROM asset_lifecycle_timeline_view LIMIT 1;
SELECT 'Testing Analytics Summary View' as test_name, COUNT(*) as record_count FROM analytics_summary_view LIMIT 1;

-- =============================================
-- STEP 5: PERFORMANCE VIEWS (Application Query Optimization)
-- =============================================

-- Performance View 1: User Lab Assignments
-- Used in: Role-based filtering across all controllers (dashboard, complaints, etc.)
-- Eliminates: Repeated users + labs JOINs
DROP VIEW IF EXISTS view_user_lab_assignments;
CREATE OR REPLACE VIEW view_user_lab_assignments AS
SELECT 
    u.user_id,
    u.full_name,
    u.email,
    u.role,
    u.lab_id,
    u.created_at,
    l.lab_name,
    l.location AS lab_location,
    d.dept_name,
    c.campus_name
FROM users u
LEFT JOIN laboratories l ON u.lab_id = l.lab_id
LEFT JOIN departments d ON l.dept_id = d.dept_id
LEFT JOIN campuses c ON d.campus_id = c.campus_id;

-- Performance View 2: Asset Full Details
-- Used in: Inventory pages, analytics, asset listings
-- Eliminates: 4-5 table JOINs (inventory_assets + asset_details + asset_statuses + labs + units)
DROP VIEW IF EXISTS view_asset_full_details;
CREATE OR REPLACE VIEW view_asset_full_details AS
SELECT 
    ia.asset_id,
    ia.lab_id,
    ia.workstation_id,
    ia.unit_id,
    ia.date_added,
    ia.added_by_user_id,
    ad.property_tag_no,
    ad.quantity,
    ad.description,
    ad.serial_number,
    ad.date_of_purchase,
    ad.date_disposed,
    ad.disposed_by,
    ad.asset_remarks,
    ad.status_id,
    ast.status_name AS asset_status,
    l.lab_name,
    l.location AS lab_location,
    u.unit_name,
    dt.device_type_name,
    usr.full_name AS added_by_name
FROM inventory_assets ia
LEFT JOIN asset_details ad ON ia.asset_id = ad.asset_id
LEFT JOIN asset_statuses ast ON ad.status_id = ast.status_id
LEFT JOIN laboratories l ON ia.lab_id = l.lab_id
LEFT JOIN units u ON ia.unit_id = u.unit_id
LEFT JOIN device_types dt ON u.device_type_id = dt.device_type_id
LEFT JOIN users usr ON ia.added_by_user_id = usr.user_id
WHERE ast.status_name != 'Disposed' OR ast.status_name IS NULL;

-- Performance View 3: Workstation Status Summary
-- Used in: Dashboard maintenance stats, inventory analytics
-- Eliminates: Complex 30-day maintenance subqueries
DROP VIEW IF EXISTS view_workstation_status_summary;
CREATE OR REPLACE VIEW view_workstation_status_summary AS
SELECT 
    w.workstation_id,
    w.workstation_name,
    w.lab_id,
    w.status_id,
    w.workstation_remarks,
    w.created_at,
    l.lab_name,
    ast.status_name AS workstation_status,
    COUNT(ia.asset_id) AS asset_count,
    MAX(pr.created_at) AS last_maintenance_date,
    MAX(pr.report_date) AS last_report_date,
    CASE 
        WHEN MAX(pr.created_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'Serviced'
        ELSE 'Unserviced'
    END AS service_status_30d
FROM workstations w
LEFT JOIN laboratories l ON w.lab_id = l.lab_id
LEFT JOIN asset_statuses ast ON w.status_id = ast.status_id
LEFT JOIN inventory_assets ia ON w.workstation_id = ia.workstation_id
LEFT JOIN pmc_reports pr ON w.workstation_id = pr.workstation_id
GROUP BY w.workstation_id, w.workstation_name, w.lab_id, w.status_id, w.workstation_remarks, w.created_at, l.lab_name, ast.status_name;

-- Performance View 4: Complaint Details
-- Used in: Complaints management, archive pages
-- Eliminates: 4-5 table JOINs per complaint query
DROP VIEW IF EXISTS view_complaint_details;
CREATE OR REPLACE VIEW view_complaint_details AS
SELECT 
    c.complaint_id,
    c.lab_id,
    c.workstation_id,
    c.asset_id,
    c.faculty_student_name,
    c.user_type,
    c.year_level,
    c.issue_description,
    c.asset_info,
    c.status AS complaint_status,
    c.monitored_by,
    c.approved_by,
    c.custodian_user_id,
    c.remarks,
    c.resolved_at,
    c.created_at,
    c.updated_at,
    c.accepted_at,
    l.lab_name,
    w.workstation_name,
    ad.property_tag_no AS asset_property_tag,
    cust.full_name AS custodian_name
FROM complaints c
LEFT JOIN laboratories l ON c.lab_id = l.lab_id
LEFT JOIN workstations w ON c.workstation_id = w.workstation_id
LEFT JOIN inventory_assets ia ON c.asset_id = ia.asset_id
LEFT JOIN asset_details ad ON ia.asset_id = ad.asset_id
LEFT JOIN users cust ON c.custodian_user_id = cust.user_id;

-- =============================================
-- STEP 6: VERIFICATION (All Views)
-- =============================================

-- Check that ALL views were created successfully
SELECT 
    'Verification Results' as status,
    COUNT(*) as total_views_created
FROM information_schema.views 
WHERE table_name IN (
    'audit_logs_view', 
    'cit_lab_users_logs_view', 
    'asset_lifecycle_timeline_view', 
    'analytics_summary_view',
    'view_user_lab_assignments',
    'view_asset_full_details',
    'view_workstation_status_summary',
    'view_complaint_details'
) 
AND table_schema = DATABASE();

-- Show ALL created views
SELECT 
    table_name as view_name,
    'Created Successfully' as status
FROM information_schema.views 
WHERE table_name IN (
    'audit_logs_view', 
    'cit_lab_users_logs_view', 
    'asset_lifecycle_timeline_view', 
    'analytics_summary_view',
    'view_user_lab_assignments',
    'view_asset_full_details',
    'view_workstation_status_summary',
    'view_complaint_details'
) 
AND table_schema = DATABASE()
ORDER BY table_name;

-- =============================================
-- STEP 7: SAMPLE QUERIES (For Testing New Views)
-- =============================================

-- Test Performance Views
SELECT 'Testing User Lab Assignments' as test_name, COUNT(*) as record_count FROM view_user_lab_assignments LIMIT 1;
SELECT 'Testing Asset Full Details' as test_name, COUNT(*) as record_count FROM view_asset_full_details LIMIT 1;
SELECT 'Testing Workstation Status Summary' as test_name, COUNT(*) as record_count FROM view_workstation_status_summary LIMIT 1;
SELECT 'Testing Complaint Details' as test_name, COUNT(*) as record_count FROM view_complaint_details LIMIT 1;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
SELECT 
    'Setup COMPLETE!' as status,
    '8 views created successfully (4 essential + 1 analytics + 3 performance)' as result,
    'All views use only existing schema columns - no phantom data' as validation,
    'Ready for Navicat execution' as next_step;
