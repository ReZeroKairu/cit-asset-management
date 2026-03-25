-- =============================================
-- Execute Asset Lifecycle Timeline Views
-- =============================================
-- Run this script to create all asset lifecycle views in the database
-- Execute this in your MySQL database management tool (Navicat, MySQL Workbench, etc.)

-- Source the main view file
SOURCE ../sql/asset_lifecycle_timeline_view.sql;

-- =============================================
-- Verification Queries
-- =============================================

-- Verify the main view was created
SHOW CREATE VIEW asset_lifecycle_timeline_view;

-- Verify supporting views were created
SHOW CREATE VIEW asset_lifecycle_by_stage_view;
SHOW CREATE VIEW aging_assets_view;
SHOW CREATE VIEW unassigned_assets_view;
SHOW CREATE VIEW assets_by_workstation_view;
SHOW CREATE VIEW assets_by_lab_view;

-- Test the main view with a sample query
SELECT COUNT(*) as total_assets FROM asset_lifecycle_timeline_view LIMIT 1;

-- Test lifecycle distribution
SELECT 
    lifecycle_stage,
    lifecycle_status,
    COUNT(*) as count 
FROM asset_lifecycle_timeline_view 
GROUP BY lifecycle_stage, lifecycle_status 
ORDER BY lifecycle_stage;

-- =============================================
-- Performance Optimization
-- =============================================

-- Create recommended indexes for better performance
-- Uncomment and run these if they don't exist:

-- CREATE INDEX idx_asset_details_date_of_purchase ON asset_details(date_of_purchase);
-- CREATE INDEX idx_inventory_assets_lab_id ON inventory_assets(lab_id);
-- CREATE INDEX idx_inventory_assets_workstation_id ON inventory_assets(workstation_id);
-- CREATE INDEX idx_inventory_assets_unit_id ON inventory_assets(unit_id);
-- CREATE INDEX idx_workstations_lab_id ON workstations(lab_id);
-- CREATE INDEX idx_units_device_type_id ON units(device_type_id);

-- =============================================
-- Success Message
-- =============================================

SELECT 'Asset Lifecycle Timeline Views created successfully!' as status;
