-- =============================================
-- Audit Logs Optimized View for CIT Asset Management
-- =============================================
-- This view provides optimized access to audit logs with user information
-- and formatted fields for better application performance
-- =============================================

CREATE OR REPLACE VIEW audit_logs_view AS
SELECT 
    -- Core audit log fields
    al.id,
    al.user_id,
    al.action,
    al.description,
    al.created_at,
    
    -- Formatted date/time fields for better UI rendering
    DATE(al.created_at) AS log_date,
    TIME(al.created_at) AS log_time,
    DATE_FORMAT(al.created_at, '%Y-%m-%d %h:%i:%s %p') AS formatted_timestamp,
    DATE_FORMAT(al.created_at, '%M %d, %Y') AS formatted_date,
    DATE_FORMAT(al.created_at, '%h:%i:%s %p') AS formatted_time,
    
    -- User information (with fallback for system actions)
    COALESCE(u.full_name, 'System') AS user_name,
    COALESCE(u.email, 'system@cit.edu') AS user_email,
    COALESCE(u.role, 'System') AS user_role,
    
    -- User laboratory information
    COALESCE(l.lab_name, 'N/A') AS user_lab_name,
    COALESCE(l.location, 'N/A') AS user_lab_location,
    
    -- IP address information
    CASE 
        WHEN al.ip_address IS NOT NULL AND al.ip_address != '' THEN al.ip_address
        ELSE 'Unknown'
    END AS ip_address_display,
    
    -- Computed fields for filtering and categorization
    CASE 
        WHEN al.user_id IS NULL THEN 'System'
        WHEN u.role = 'Admin' THEN 'Administrator'
        WHEN u.role = 'Custodian' THEN 'Custodian'
        ELSE 'Unknown'
    END AS user_type,
    
    -- Action categorization for better filtering
    CASE 
        WHEN al.action IN ('CREATE', 'UPDATE', 'DELETE') THEN 'CRUD Operation'
        WHEN al.action IN ('LOGIN', 'LOGOUT') THEN 'Authentication'
        WHEN al.action IN ('GENERATE', 'VALIDATE') THEN 'Token Management'
        WHEN al.action IN ('SUBMIT', 'APPROVE', 'DENY') THEN 'Form Processing'
        ELSE 'Other'
    END AS action_category,
    
    -- Priority level for visual indicators
    CASE 
        WHEN al.action IN ('DELETE', 'LOGIN', 'GENERATE') THEN 'High'
        WHEN al.action IN ('CREATE', 'UPDATE', 'APPROVE', 'DENY') THEN 'Medium'
        ELSE 'Low'
    END AS priority_level,
    
    -- Search optimization: combined searchable text
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

-- =============================================
-- Additional Views for Specific Audit Use Cases
-- =============================================

-- View for recent audit logs (last 30 days)
CREATE OR REPLACE VIEW recent_audit_logs_view AS
SELECT * 
FROM audit_logs_view 
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY created_at DESC;

-- View for user-specific audit logs
CREATE OR REPLACE VIEW user_audit_logs_view AS
SELECT 
    *,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as user_action_rank
FROM audit_logs_view
ORDER BY user_id, created_at DESC;

-- View for system actions only
CREATE OR REPLACE VIEW system_audit_logs_view AS
SELECT * 
FROM audit_logs_view 
WHERE user_type = 'System'
ORDER BY created_at DESC;

-- View for high-priority actions
CREATE OR REPLACE VIEW high_priority_audit_logs_view AS
SELECT * 
FROM audit_logs_view 
WHERE priority_level = 'High'
ORDER BY created_at DESC;

-- =============================================
-- Index Recommendations for Performance
-- =============================================
-- Run these indexes separately in Navicat for better performance:

-- CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
-- CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
-- CREATE INDEX idx_audit_logs_action ON audit_logs(action);
-- CREATE INDEX idx_users_lab_id ON users(lab_id);
-- CREATE INDEX idx_laboratories_name ON laboratories(lab_name);

-- =============================================
-- Sample Queries for Testing
-- =============================================

-- Get all audit logs with user info
-- SELECT * FROM audit_logs_view ORDER BY created_at DESC LIMIT 50;

-- Get audit logs by specific user
-- SELECT * FROM audit_logs_view WHERE user_id = 1 ORDER BY created_at DESC;

-- Get audit logs by action type
-- SELECT * FROM audit_logs_view WHERE action = 'CREATE' ORDER BY created_at DESC;

-- Get audit logs by date range
-- SELECT * FROM audit_logs_view 
-- WHERE log_date BETWEEN '2024-01-01' AND '2024-12-31'
-- ORDER BY created_at DESC;

-- Search audit logs
-- SELECT * FROM audit_logs_view 
-- WHERE searchable_text LIKE '%keyword%'
-- ORDER BY created_at DESC;

-- Get audit logs statistics
-- SELECT 
--     user_type,
--     action_category,
--     COUNT(*) as count,
--     MAX(created_at) as last_action
-- FROM audit_logs_view 
-- GROUP BY user_type, action_category
-- ORDER BY count DESC;
