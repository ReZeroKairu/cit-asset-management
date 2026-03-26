-- =============================================
-- Asset Lifecycle Timeline View for CIT Asset Management
-- =============================================
-- This view provides comprehensive asset lifecycle data with calculated age,
-- timeline position, and all relevant relationships for timeline visualization
-- =============================================

CREATE OR REPLACE VIEW asset_lifecycle_timeline_view AS
SELECT 
    -- Core asset information
    ia.asset_id,
    COALESCE(ad.property_tag_no, 'N/A') AS property_tag_no,
    COALESCE(ad.serial_number, 'N/A') AS serial_number,
    COALESCE(ad.description, 'N/A') AS description,
    COALESCE(ad.quantity, 1) AS quantity,
    COALESCE(ad.asset_remarks, 'N/A') AS asset_remarks,
    
    -- Asset age calculations
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
    
    -- Timeline position (Y1-Y5 lifecycle stages)
    CASE 
        WHEN ad.date_of_purchase IS NULL THEN 0
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 0 THEN 0  -- Y1 (0-1 years)
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 1 THEN 1  -- Y1 (1 year)
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 2 THEN 2  -- Y2
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 3 THEN 3  -- Y3
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 4 THEN 4  -- Y4
        ELSE 5  -- Y5 (5+ years)
    END AS timeline_position,
    
    -- Lifecycle stage labels
    CASE 
        WHEN ad.date_of_purchase IS NULL THEN 'Unknown'
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) <= 1 THEN 'Y1'
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 2 THEN 'Y2'
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 3 THEN 'Y3'
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 4 THEN 'Y4'
        ELSE 'Y5'
    END AS lifecycle_stage,
    
    -- Lifecycle status indicators
    CASE 
        WHEN ad.date_of_purchase IS NULL THEN 'Unknown'
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) <= 1 THEN 'Good'
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 2 THEN 'Monitor'
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 3 THEN 'Replace Soon'
        ELSE 'Replace Now'
    END AS lifecycle_status,
    
    -- Status information
    COALESCE(ast.status_name, 'Unknown') AS status_name,
    ia.status_id,
    
    -- Unit information
    COALESCE(u.unit_name, 'Unknown') AS unit_name,
    ia.unit_id,
    
    -- Device type information
    COALESCE(dt.device_type_name, 'Unknown') AS device_type_name,
    dt.device_type_id,
    
    -- Workstation information
    COALESCE(ws.workstation_name, 'Not Assigned') AS workstation_name,
    ia.workstation_id,
    
    -- Laboratory information
    COALESCE(l.lab_name, 'Not Assigned') AS lab_name,
    ia.lab_id,
    COALESCE(l.location, 'N/A') AS lab_location,
    
    -- Asset name (fallback to unit name if no specific name)
    COALESCE(
        CASE 
            WHEN ad.description IS NOT NULL AND ad.description != '' THEN 
                CONCAT(u.unit_name, ' - ', ad.description)
            ELSE u.unit_name
        END,
        'Unknown Asset'
    ) AS asset_name,
    
    -- Purchase information
    ad.date_of_purchase,
    CASE 
        WHEN ad.date_of_purchase IS NOT NULL THEN 
            DATE_FORMAT(ad.date_of_purchase, '%M %d, %Y')
        ELSE 'Unknown'
    END AS formatted_purchase_date,
    
    -- Added information
    ia.date_added,
    CASE 
        WHEN ia.date_added IS NOT NULL THEN 
            DATE_FORMAT(ia.date_added, '%M %d, %Y %h:%i %p')
        ELSE 'Unknown'
    END AS formatted_added_date,
    
    -- Added by user
    COALESCE(au.full_name, 'System') AS added_by_name,
    COALESCE(au.email, 'system@cit.edu') AS added_by_email,
    
    -- Current date for calculations
    CURDATE() AS current_date,
    
    -- Computed fields for filtering and analysis
    CASE 
        WHEN ia.workstation_id IS NOT NULL THEN 'Assigned'
        WHEN ia.lab_id IS NOT NULL THEN 'Lab Only'
        ELSE 'Unassigned'
    END AS assignment_status,
    
    -- Age category for filtering
    CASE 
        WHEN ad.date_of_purchase IS NULL THEN 'Unknown'
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) = 0 THEN 'New'
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) <= 2 THEN 'Young'
        WHEN TIMESTAMPDIFF(YEAR, ad.date_of_purchase, CURDATE()) <= 4 THEN 'Mature'
        ELSE 'Aging'
    END AS age_category,
    
    -- Search optimization: combined searchable text
    CONCAT(
        COALESCE(ad.property_tag_no, ''), ' ',
        COALESCE(ad.serial_number, ''), ' ',
        COALESCE(ad.description, ''), ' ',
        COALESCE(u.unit_name, ''), ' ',
        COALESCE(dt.device_type_name, ''), ' ',
        COALESCE(ws.workstation_name, ''), ' ',
        COALESCE(l.lab_name, ''), ' ',
        COALESCE(ast.status_name, '')
    ) AS searchable_text

FROM inventory_assets ia
LEFT JOIN asset_details ad ON ia.asset_id = ad.asset_id
LEFT JOIN asset_statuses ast ON ia.status_id = ast.status_id
LEFT JOIN units u ON ia.unit_id = u.unit_id
LEFT JOIN device_types dt ON u.device_type_id = dt.device_type_id
LEFT JOIN workstations ws ON ia.workstation_id = ws.workstation_id
LEFT JOIN laboratories l ON ia.lab_id = l.lab_id
LEFT JOIN users au ON ia.added_by_user_id = au.user_id;

-- =============================================
-- Additional Views for Specific Timeline Use Cases
-- =============================================

-- View for assets by lifecycle stage
CREATE OR REPLACE VIEW asset_lifecycle_by_stage_view AS
SELECT 
    lifecycle_stage,
    lifecycle_status,
    COUNT(*) AS asset_count,
    COUNT(DISTINCT lab_id) AS lab_count,
    COUNT(DISTINCT workstation_id) AS workstation_count,
    AVG(current_age_years) AS avg_age_years,
    COUNT(CASE WHEN assignment_status = 'Assigned' THEN 1 END) AS assigned_count,
    COUNT(CASE WHEN assignment_status = 'Unassigned' THEN 1 END) AS unassigned_count
FROM asset_lifecycle_timeline_view 
GROUP BY lifecycle_stage, lifecycle_status
ORDER BY 
    CASE lifecycle_stage
        WHEN 'Y1' THEN 1
        WHEN 'Y2' THEN 2
        WHEN 'Y3' THEN 3
        WHEN 'Y4' THEN 4
        WHEN 'Y5' THEN 5
        ELSE 6
    END;

-- View for assets requiring attention (aging assets)
CREATE OR REPLACE VIEW aging_assets_view AS
SELECT * 
FROM asset_lifecycle_timeline_view 
WHERE lifecycle_status IN ('Replace Soon', 'Replace Now')
ORDER BY current_age_years DESC, lab_name, workstation_name;

-- View for unassigned assets
CREATE OR REPLACE VIEW unassigned_assets_view AS
SELECT * 
FROM asset_lifecycle_timeline_view 
WHERE assignment_status = 'Unassigned'
ORDER BY date_added DESC, lab_name;

-- View for assets by workstation
CREATE OR REPLACE VIEW assets_by_workstation_view AS
SELECT 
    workstation_name,
    lab_name,
    COUNT(*) AS total_assets,
    COUNT(CASE WHEN lifecycle_status = 'Good' THEN 1 END) AS good_assets,
    COUNT(CASE WHEN lifecycle_status = 'Monitor' THEN 1 END) AS monitor_assets,
    COUNT(CASE WHEN lifecycle_status = 'Replace Soon' THEN 1 END) AS replace_soon_assets,
    COUNT(CASE WHEN lifecycle_status = 'Replace Now' THEN 1 END) AS replace_now_assets,
    COUNT(CASE WHEN assignment_status = 'Unassigned' THEN 1 END) AS unassigned_assets,
    AVG(current_age_years) AS avg_age_years,
    MIN(current_age_years) AS min_age_years,
    MAX(current_age_years) AS max_age_years
FROM asset_lifecycle_timeline_view 
WHERE workstation_name != 'Not Assigned'
GROUP BY workstation_name, lab_name
ORDER BY lab_name, workstation_name;

-- View for assets by lab
CREATE OR REPLACE VIEW assets_by_lab_view AS
SELECT 
    lab_name,
    lab_location,
    COUNT(*) AS total_assets,
    COUNT(DISTINCT workstation_id) AS workstation_count,
    COUNT(CASE WHEN lifecycle_status = 'Good' THEN 1 END) AS good_assets,
    COUNT(CASE WHEN lifecycle_status = 'Monitor' THEN 1 END) AS monitor_assets,
    COUNT(CASE WHEN lifecycle_status = 'Replace Soon' THEN 1 END) AS replace_soon_assets,
    COUNT(CASE WHEN lifecycle_status = 'Replace Now' THEN 1 END) AS replace_now_assets,
    COUNT(CASE WHEN assignment_status = 'Assigned' THEN 1 END) AS assigned_assets,
    COUNT(CASE WHEN assignment_status = 'Unassigned' THEN 1 END) AS unassigned_assets,
    AVG(current_age_years) AS avg_age_years,
    COUNT(DISTINCT device_type_id) AS device_type_count
FROM asset_lifecycle_timeline_view 
WHERE lab_name != 'Not Assigned'
GROUP BY lab_name, lab_location
ORDER BY lab_name;

-- =============================================
-- Index Recommendations for Performance
-- =============================================
-- Run these indexes separately in your database management tool:

-- CREATE INDEX idx_asset_details_date_of_purchase ON asset_details(date_of_purchase);
-- CREATE INDEX idx_inventory_assets_lab_id ON inventory_assets(lab_id);
-- CREATE INDEX idx_inventory_assets_workstation_id ON inventory_assets(workstation_id);
-- CREATE INDEX idx_inventory_assets_unit_id ON inventory_assets(unit_id);
-- CREATE INDEX idx_workstations_lab_id ON workstations(lab_id);
-- CREATE INDEX idx_units_device_type_id ON units(device_type_id);

-- =============================================
-- Sample Queries for Testing
-- =============================================

-- Get all assets with timeline information
-- SELECT * FROM asset_lifecycle_timeline_view ORDER BY current_age_years DESC;

-- Get assets by lifecycle stage
-- SELECT lifecycle_stage, lifecycle_status, COUNT(*) as count 
-- FROM asset_lifecycle_timeline_view 
-- GROUP BY lifecycle_stage, lifecycle_status 
-- ORDER BY lifecycle_stage;

-- Get aging assets (replace soon/now)
-- SELECT * FROM aging_assets_view WHERE lifecycle_status = 'Replace Now';

-- Get assets by specific workstation
-- SELECT * FROM asset_lifecycle_timeline_view WHERE workstation_name = 'WS-001';

-- Get unassigned assets
-- SELECT * FROM unassigned_assets_view ORDER BY date_added DESC;

-- Get assets by lab with summary
-- SELECT * FROM assets_by_lab_view WHERE lab_name = 'Computer Lab 1';

-- Search assets
-- SELECT * FROM asset_lifecycle_timeline_view 
-- WHERE searchable_text LIKE '%monitor%' 
-- ORDER BY asset_name;

-- Get asset lifecycle summary
-- SELECT * FROM asset_lifecycle_by_stage_view ORDER BY lifecycle_stage;

-- =============================================
-- View Statistics and Information
-- =============================================

-- Total assets count
-- SELECT COUNT(*) as total_assets FROM asset_lifecycle_timeline_view;

-- Assets by status
-- SELECT status_name, COUNT(*) as count FROM asset_lifecycle_timeline_view 
-- GROUP BY status_name ORDER BY count DESC;

-- Assets by assignment status
-- SELECT assignment_status, COUNT(*) as count FROM asset_lifecycle_timeline_view 
-- GROUP BY assignment_status ORDER BY count DESC;

-- Average asset age
-- SELECT AVG(current_age_years) as avg_age FROM asset_lifecycle_timeline_view 
-- WHERE current_age_years > 0;
