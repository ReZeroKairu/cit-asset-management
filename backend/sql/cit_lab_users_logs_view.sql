-- =============================================
-- CIT Lab Users Logs Optimized View for CIT Asset Management
-- =============================================
-- This view provides optimized access to CIT lab users logs with
-- formatted fields and enhanced data for better application performance
-- =============================================

CREATE OR REPLACE VIEW cit_lab_users_logs_view AS
SELECT 
    -- Core CIT lab log fields
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
    
    -- Formatted date/time fields for better UI rendering
    DATE(cll.date) AS log_date,
    TIME(cll.created_at) AS log_time,
    DATE_FORMAT(cll.date, '%Y-%m-%d') AS formatted_date,
    DATE_FORMAT(cll.created_at, '%Y-%m-%d %h:%i:%s %p') AS formatted_timestamp,
    DATE_FORMAT(cll.created_at, '%M %d, %Y') AS formatted_created_date,
    DATE_FORMAT(cll.created_at, '%h:%i:%s %p') AS formatted_created_time,
    
    -- Enhanced usage type display
    CASE 
        WHEN cll.usage_type = 'set-in-reservation' THEN 'Set-in/Reservation'
        WHEN cll.usage_type = 'printing' THEN 'Printing'
        ELSE COALESCE(cll.usage_type, 'Unknown')
    END AS usage_type_display,
    
    -- User type categorization with colors
    CASE 
        WHEN cll.user_type = 'Student' THEN 'Student'
        WHEN cll.user_type = 'Faculty' THEN 'Faculty'
        ELSE COALESCE(cll.user_type, 'Unknown')
    END AS user_type_category,
    
    -- Laboratory categorization
    CASE 
        WHEN cll.laboratory = 'e-forum' THEN 'E-Forum'
        ELSE COALESCE(cll.laboratory, 'Unknown Lab')
    END AS laboratory_display,
    
    -- Year level processing
    CASE 
        WHEN cll.year_level LIKE '%Year%' THEN cll.year_level
        WHEN cll.year_level REGEXP '^[1-5]' THEN CONCAT(cll.year_level, ' Year')
        ELSE COALESCE(cll.year_level, 'N/A')
    END AS year_level_display,
    
    -- Workstation number processing
    CASE 
        WHEN cll.ws_number IS NOT NULL AND cll.ws_number != '' THEN cll.ws_number
        ELSE 'N/A'
    END AS ws_number_display,
    
    -- Printing pages processing
    CASE 
        WHEN cll.printing_pages IS NOT NULL AND cll.printing_pages != '' THEN cll.printing_pages
        ELSE 'N/A'
    END AS printing_pages_display,
    
    -- Monitored by processing
    CASE 
        WHEN cll.monitored_by IS NOT NULL AND cll.monitored_by != '' THEN cll.monitored_by
        ELSE 'Not Monitored'
    END AS monitored_by_display,
    
    -- IP address processing
    CASE 
        WHEN cll.ip_address IS NOT NULL AND cll.ip_address != '' THEN cll.ip_address
        ELSE 'Unknown'
    END AS ip_address_display,
    
    -- Computed fields for filtering and categorization
    CASE 
        WHEN cll.usage_type = 'set-in-reservation' THEN 'Lab Usage'
        WHEN cll.usage_type = 'printing' THEN 'Printing Service'
        ELSE 'Other'
    END AS usage_category,
    
    CASE 
        WHEN cll.user_type = 'Student' THEN 'Student User'
        WHEN cll.user_type = 'Faculty' THEN 'Faculty User'
        ELSE 'Unknown User'
    END AS user_category,
    
    -- Priority level for visual indicators (based on usage type)
    CASE 
        WHEN cll.usage_type = 'printing' THEN 'High'  -- Printing resources consumption
        WHEN cll.usage_type = 'set-in-reservation' THEN 'Medium'  -- Lab space usage
        ELSE 'Low'
    END AS priority_level,
    
    -- Search optimization: combined searchable text
    CONCAT(
        COALESCE(cll.faculty_student_name, ''), ' ',
        COALESCE(cll.laboratory, ''), ' ',
        COALESCE(cll.usage_type, ''), ' ',
        COALESCE(cll.purpose, ''), ' ',
        COALESCE(cll.user_type, ''), ' ',
        COALESCE(cll.monitored_by, ''), ' ',
        COALESCE(cll.ws_number, ''), ' ',
        COALESCE(cll.year_level, '')
    ) AS searchable_text,
    
    -- Additional computed fields for analytics
    -- Day of week for usage patterns
    DAYNAME(cll.date) AS day_of_week,
    
    -- Month for monthly reports
    MONTHNAME(cll.date) AS month_name,
    MONTH(cll.date) AS month_number,
    
    -- Year for yearly reports
    YEAR(cll.date) AS year_number,
    
    -- Quarter for quarterly reports
    QUARTER(cll.date) AS quarter_number,
    
    -- Time-based categorization
    CASE 
        WHEN TIME(cll.created_at) BETWEEN '06:00:00' AND '11:59:59' THEN 'Morning'
        WHEN TIME(cll.created_at) BETWEEN '12:00:00' AND '17:59:59' THEN 'Afternoon'
        WHEN TIME(cll.created_at) BETWEEN '18:00:00' AND '23:59:59' THEN 'Evening'
        ELSE 'Night'
    END AS time_of_day

FROM cit_lab_logs cll;

-- =============================================
-- Additional Views for Specific CIT Lab Users Use Cases
-- =============================================

-- View for recent CIT lab users logs (last 30 days)
CREATE OR REPLACE VIEW recent_cit_lab_users_logs_view AS
SELECT * 
FROM cit_lab_users_logs_view 
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY created_at DESC;

-- View for today's CIT lab users logs
CREATE OR REPLACE VIEW today_cit_lab_users_logs_view AS
SELECT * 
FROM cit_lab_users_logs_view 
WHERE DATE(date) = CURDATE()
ORDER BY created_at DESC;

-- View for student users only
CREATE OR REPLACE VIEW student_cit_lab_users_logs_view AS
SELECT * 
FROM cit_lab_users_logs_view 
WHERE user_type = 'Student'
ORDER BY created_at DESC;

-- View for faculty users only
CREATE OR REPLACE VIEW faculty_cit_lab_users_logs_view AS
SELECT * 
FROM cit_lab_users_logs_view 
WHERE user_type = 'Faculty'
ORDER BY created_at DESC;

-- View for printing usage only
CREATE OR REPLACE VIEW printing_cit_lab_users_logs_view AS
SELECT * 
FROM cit_lab_users_logs_view 
WHERE usage_type = 'printing'
ORDER BY created_at DESC;

-- View for lab usage (set-in/reservation) only
CREATE OR REPLACE VIEW lab_usage_cit_lab_users_logs_view AS
SELECT * 
FROM cit_lab_users_logs_view 
WHERE usage_type = 'set-in-reservation'
ORDER BY created_at DESC;

-- View for high-priority logs (printing usage)
CREATE OR REPLACE VIEW high_priority_cit_lab_users_logs_view AS
SELECT * 
FROM cit_lab_users_logs_view 
WHERE priority_level = 'High'
ORDER BY created_at DESC;

-- =============================================
-- Index Recommendations for Performance
-- =============================================
-- Run these indexes separately in your database management tool for better performance:

-- CREATE INDEX idx_cit_lab_logs_created_at ON cit_lab_logs(created_at);
-- CREATE INDEX idx_cit_lab_logs_date ON cit_lab_logs(date);
-- CREATE INDEX idx_cit_lab_logs_laboratory ON cit_lab_logs(laboratory);
-- CREATE INDEX idx_cit_lab_logs_user_type ON cit_lab_logs(user_type);
-- CREATE INDEX idx_cit_lab_logs_usage_type ON cit_lab_logs(usage_type);
-- CREATE INDEX idx_cit_lab_logs_faculty_name ON cit_lab_logs(faculty_student_name);

-- =============================================
-- Sample Queries for Testing
-- =============================================

-- Get all CIT lab users logs with enhanced formatting
-- SELECT * FROM cit_lab_users_logs_view ORDER BY created_at DESC LIMIT 50;

-- Get logs by specific laboratory
-- SELECT * FROM cit_lab_users_logs_view WHERE laboratory = 'E-Forum' ORDER BY created_at DESC;

-- Get logs by user type
-- SELECT * FROM cit_lab_users_logs_view WHERE user_type = 'Student' ORDER BY created_at DESC;

-- Get logs by usage type
-- SELECT * FROM cit_lab_users_logs_view WHERE usage_type = 'printing' ORDER BY created_at DESC;

-- Get logs by date range
-- SELECT * FROM cit_lab_users_logs_view 
-- WHERE log_date BETWEEN '2024-01-01' AND '2024-12-31'
-- ORDER BY created_at DESC;

-- Search logs
-- SELECT * FROM cit_lab_users_logs_view 
-- WHERE searchable_text LIKE '%keyword%'
-- ORDER BY created_at DESC;

-- Get usage statistics by laboratory
-- SELECT 
--     laboratory_display,
--     usage_category,
--     COUNT(*) as count,
--     COUNT(DISTINCT faculty_student_name) as unique_users
-- FROM cit_lab_users_logs_view 
-- GROUP BY laboratory_display, usage_category
-- ORDER BY count DESC;

-- Get usage statistics by user type
-- SELECT 
--     user_type_category,
--     usage_category,
--     COUNT(*) as count
-- FROM cit_lab_users_logs_view 
-- GROUP BY user_type_category, usage_category
-- ORDER BY count DESC;

-- Get daily usage patterns
-- SELECT 
--     day_of_week,
--     time_of_day,
--     COUNT(*) as count
-- FROM cit_lab_users_logs_view 
-- GROUP BY day_of_week, time_of_day
-- ORDER BY count DESC;

-- Get monthly usage trends
-- SELECT 
--     month_name,
--     year_number,
--     COUNT(*) as total_logs,
--     COUNT(DISTINCT faculty_student_name) as unique_users,
--     SUM(CASE WHEN usage_type = 'printing' THEN 1 ELSE 0 END) as printing_count,
--     SUM(CASE WHEN usage_type = 'set-in-reservation' THEN 1 ELSE 0 END) as lab_usage_count
-- FROM cit_lab_users_logs_view 
-- GROUP BY month_name, year_number
-- ORDER BY year_number DESC, month_number DESC;
