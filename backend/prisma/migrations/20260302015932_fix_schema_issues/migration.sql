-- CreateTable
CREATE TABLE `asset_details` (
    `detail_id` INTEGER NOT NULL AUTO_INCREMENT,
    `asset_id` INTEGER NOT NULL,
    `property_tag_no` VARCHAR(50) NULL,
    `quantity` INTEGER NULL DEFAULT 1,
    `description` TEXT NULL,
    `serial_number` VARCHAR(100) NULL,
    `date_of_purchase` DATE NULL,
    `asset_remarks` TEXT NULL,
    `status_id` INTEGER NULL DEFAULT 1,

    UNIQUE INDEX `asset_details_asset_id_key`(`asset_id`),
    UNIQUE INDEX `property_tag_no`(`property_tag_no`),
    INDEX `asset_details_asset_id_idx`(`asset_id`),
    INDEX `asset_details_status_id_idx`(`status_id`),
    PRIMARY KEY (`detail_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campuses` (
    `campus_id` INTEGER NOT NULL AUTO_INCREMENT,
    `campus_name` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`campus_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complaints` (
    `complaint_id` INTEGER NOT NULL AUTO_INCREMENT,
    `lab_id` INTEGER NOT NULL,
    `workstation_id` INTEGER NULL,
    `asset_id` INTEGER NULL,
    `faculty_student_name` VARCHAR(100) NOT NULL,
    `user_type` VARCHAR(20) NOT NULL,
    `year_level` VARCHAR(20) NULL,
    `issue_description` TEXT NOT NULL,
    `asset_info` VARCHAR(50) NULL,
    `status` ENUM('Open', 'In_Progress', 'Resolved', 'Denied') NOT NULL DEFAULT 'Open',
    `monitored_by` VARCHAR(100) NULL,
    `approved_by` VARCHAR(100) NULL,
    `custodian_user_id` INTEGER NULL,
    `remarks` TEXT NULL,
    `resolved_at` DATETIME(3) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,
    `accepted_at` TIMESTAMP(0) NULL,

    INDEX `complaints_created_at_idx`(`created_at`),
    INDEX `complaints_custodian_user_id_idx`(`custodian_user_id`),
    INDEX `complaints_lab_id_idx`(`lab_id`),
    INDEX `complaints_status_idx`(`status`),
    INDEX `complaints_asset_id_idx`(`asset_id`),
    PRIMARY KEY (`complaint_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_report_procedures` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `report_id` INTEGER NOT NULL,
    `procedure_id` INTEGER NOT NULL,
    `overall_status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
    `overall_remarks` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `procedure_id`(`procedure_id`),
    INDEX `report_id`(`report_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_reports` (
    `report_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `lab_id` INTEGER NOT NULL,
    `report_date` DATE NOT NULL,
    `general_remarks` TEXT NULL,
    `status` ENUM('Pending', 'Approved') NULL DEFAULT 'Pending',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `lab_id`(`lab_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`report_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `dept_id` INTEGER NOT NULL AUTO_INCREMENT,
    `dept_name` VARCHAR(100) NOT NULL,
    `campus_id` INTEGER NULL,
    `office_type_id` INTEGER NULL,
    `designee_name` VARCHAR(100) NULL,

    INDEX `campus_id`(`campus_id`),
    INDEX `office_type_id`(`office_type_id`),
    PRIMARY KEY (`dept_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `device_types` (
    `device_type_id` INTEGER NOT NULL AUTO_INCREMENT,
    `device_type_name` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`device_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_borrows` (
    `borrow_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `date` DATE NOT NULL,
    `laboratory` VARCHAR(20) NOT NULL,
    `faculty_student_name` VARCHAR(100) NOT NULL,
    `year_level` VARCHAR(20) NULL,
    `release_time` VARCHAR(10) NOT NULL,
    `returned_time` VARCHAR(10) NULL,
    `equipment_list` JSON NOT NULL,
    `purpose` TEXT NOT NULL,
    `requested_by` VARCHAR(100) NOT NULL,
    `remarks` TEXT NULL,
    `monitored_by` VARCHAR(100) NULL,
    `approved_by` VARCHAR(100) NULL,
    `status` ENUM('Pending', 'Admin_Approved', 'Custodian_Approved', 'Denied', 'Returned') NOT NULL DEFAULT 'Pending',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `user_type` VARCHAR(20) NULL,

    INDEX `equipment_borrows_user_id_idx`(`user_id`),
    PRIMARY KEY (`borrow_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_assets` (
    `asset_id` INTEGER NOT NULL AUTO_INCREMENT,
    `lab_id` INTEGER NULL,
    `workstation_id` INTEGER NULL,
    `unit_id` INTEGER NULL,
    `added_by_user_id` INTEGER NULL,
    `date_added` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `added_by_user_id`(`added_by_user_id`),
    INDEX `inventory_assets_workstation_id_idx`(`workstation_id`),
    INDEX `lab_id`(`lab_id`),
    INDEX `unit_id`(`unit_id`),
    PRIMARY KEY (`asset_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `laboratories` (
    `lab_id` INTEGER NOT NULL AUTO_INCREMENT,
    `lab_name` VARCHAR(50) NOT NULL,
    `location` VARCHAR(50) NULL,
    `dept_id` INTEGER NULL,
    `in_charge_id` INTEGER NULL,

    INDEX `dept_id`(`dept_id`),
    INDEX `laboratories_in_charge_id_idx`(`in_charge_id`),
    PRIMARY KEY (`lab_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `office_types` (
    `type_id` INTEGER NOT NULL AUTO_INCREMENT,
    `type_name` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `type_name`(`type_name`),
    PRIMARY KEY (`type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `one_time_links` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(255) NOT NULL,
    `form_type` VARCHAR(50) NULL,
    `generated_by` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `expires_at` TIMESTAMP(0) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `one_time_links_token_key`(`token`),
    INDEX `one_time_links_generated_by_fkey`(`generated_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pmc_report_procedures` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pmc_id` INTEGER NOT NULL,
    `procedure_id` INTEGER NOT NULL,
    `is_checked` BOOLEAN NOT NULL DEFAULT true,
    `remarks` VARCHAR(255) NULL,

    INDEX `pmc_report_procedures_pmc_id_idx`(`pmc_id`),
    INDEX `pmc_report_procedures_procedure_id_idx`(`procedure_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pmc_reports` (
    `pmc_id` INTEGER NOT NULL AUTO_INCREMENT,
    `report_date` DATE NOT NULL,
    `quarter` VARCHAR(20) NOT NULL,
    `lab_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `workstation_id` INTEGER NOT NULL,
    `workstation_status` VARCHAR(50) NOT NULL DEFAULT 'Functional',
    `overall_remarks` TEXT NULL,
    `software_name` VARCHAR(100) NULL,
    `software_status` VARCHAR(50) NULL DEFAULT 'Functional',
    `connectivity_type` VARCHAR(50) NULL,
    `connectivity_type_status` VARCHAR(50) NULL DEFAULT 'Functional',
    `connectivity_speed` VARCHAR(50) NULL,
    `connectivity_speed_status` VARCHAR(50) NULL DEFAULT 'Functional',
    `service_count` INTEGER NOT NULL DEFAULT 1,
    `updated_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pmc_reports_lab_id_idx`(`lab_id`),
    INDEX `pmc_reports_user_id_idx`(`user_id`),
    INDEX `pmc_reports_workstation_id_idx`(`workstation_id`),
    UNIQUE INDEX `pmc_reports_workstation_id_quarter_key`(`workstation_id`, `quarter`),
    PRIMARY KEY (`pmc_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `procedures` (
    `procedure_id` INTEGER NOT NULL AUTO_INCREMENT,
    `procedure_name` VARCHAR(100) NOT NULL,
    `category` VARCHAR(50) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `procedures_procedure_id_idx`(`procedure_id`),
    PRIMARY KEY (`procedure_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_workstation_items` (
    `item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `report_id` INTEGER NOT NULL,
    `workstation_id` INTEGER NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'Working',
    `remarks` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `report_id`(`report_id`),
    INDEX `workstation_id`(`workstation_id`),
    PRIMARY KEY (`item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asset_statuses` (
    `status_id` INTEGER NOT NULL AUTO_INCREMENT,
    `status_name` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `asset_statuses_status_name_key`(`status_name`),
    PRIMARY KEY (`status_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_requests` (
    `request_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `date` DATE NOT NULL,
    `usage_type` VARCHAR(20) NOT NULL,
    `faculty_student_name` VARCHAR(100) NOT NULL,
    `year_level` VARCHAR(20) NULL,
    `laboratory` VARCHAR(20) NOT NULL,
    `printing_pages` VARCHAR(50) NULL,
    `ws_number` VARCHAR(50) NULL,
    `time_in` VARCHAR(10) NULL,
    `time_out` VARCHAR(10) NULL,
    `purpose` TEXT NOT NULL,
    `requested_by` VARCHAR(100) NOT NULL,
    `remarks` TEXT NULL,
    `monitored_by` VARCHAR(100) NULL,
    `approved_by` VARCHAR(100) NULL,
    `status` ENUM('Pending', 'Admin_Approved', 'Custodian_Approved', 'Denied', 'Completed') NOT NULL DEFAULT 'Pending',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `user_type` VARCHAR(20) NULL,

    INDEX `lab_requests_user_id_idx`(`user_id`),
    PRIMARY KEY (`request_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_log_assets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `log_id` INTEGER NOT NULL,
    `asset_id` INTEGER NOT NULL,
    `action` VARCHAR(30) NOT NULL,
    `status_before` VARCHAR(50) NULL,
    `status_after` VARCHAR(50) NULL,
    `remarks` TEXT NULL,
    `old_property_tag` VARCHAR(50) NULL,
    `new_property_tag` VARCHAR(50) NULL,
    `replacement_asset_id` INTEGER NULL,

    INDEX `service_log_assets_asset_id_idx`(`asset_id`),
    INDEX `service_log_assets_log_id_idx`(`log_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_log_procedures` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `log_id` INTEGER NOT NULL,
    `procedure_id` INTEGER NOT NULL,
    `is_checked` BOOLEAN NOT NULL DEFAULT true,
    `remarks` VARCHAR(255) NULL,

    INDEX `service_log_procedures_log_id_idx`(`log_id`),
    INDEX `service_log_procedures_procedure_id_idx`(`procedure_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_logs` (
    `log_id` INTEGER NOT NULL AUTO_INCREMENT,
    `pmc_id` INTEGER NOT NULL,
    `service_type` VARCHAR(30) NOT NULL,
    `service_date` DATE NOT NULL,
    `performed_by` INTEGER NOT NULL,
    `remarks` TEXT NULL,
    `workstation_status_before` VARCHAR(50) NULL,
    `workstation_status_after` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `service_logs_performed_by_idx`(`performed_by`),
    INDEX `service_logs_pmc_id_idx`(`pmc_id`),
    INDEX `service_logs_service_date_idx`(`service_date`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `software_installations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `faculty_name` VARCHAR(100) NOT NULL,
    `date` DATE NOT NULL,
    `laboratory` VARCHAR(20) NOT NULL,
    `software_list` TEXT NOT NULL,
    `requested_by` VARCHAR(100) NOT NULL,
    `installation_remarks` TEXT NULL,
    `prepared_by` VARCHAR(100) NULL,
    `feedback_date` DATE NULL,
    `status` ENUM('Pending', 'Admin_Approved', 'Custodian_Approved', 'Denied', 'Completed') NOT NULL DEFAULT 'Pending',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `software_installations_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `units` (
    `unit_id` INTEGER NOT NULL AUTO_INCREMENT,
    `unit_name` VARCHAR(50) NOT NULL,
    `device_type_id` INTEGER NOT NULL,

    INDEX `device_type_id`(`device_type_id`),
    PRIMARY KEY (`unit_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('Admin', 'Custodian') NULL DEFAULT 'Custodian',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `lab_id` INTEGER NULL,

    UNIQUE INDEX `email`(`email`),
    INDEX `users_lab_id_fkey`(`lab_id`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workstations` (
    `workstation_id` INTEGER NOT NULL AUTO_INCREMENT,
    `workstation_name` VARCHAR(100) NOT NULL,
    `lab_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status_id` INTEGER NULL DEFAULT 1,
    `workstation_remarks` TEXT NULL,

    INDEX `workstations_lab_id_idx`(`lab_id`),
    INDEX `workstations_status_id_idx`(`status_id`),
    UNIQUE INDEX `workstations_workstation_name_lab_id_key`(`workstation_name`, `lab_id`),
    PRIMARY KEY (`workstation_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `asset_details` ADD CONSTRAINT `asset_details_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `inventory_assets`(`asset_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_details` ADD CONSTRAINT `asset_details_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `asset_statuses`(`status_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_custodian_user_id_fkey` FOREIGN KEY (`custodian_user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `laboratories`(`lab_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_workstation_id_fkey` FOREIGN KEY (`workstation_id`) REFERENCES `workstations`(`workstation_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `inventory_assets`(`asset_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_report_procedures` ADD CONSTRAINT `daily_report_procedures_procedure_id_fkey` FOREIGN KEY (`procedure_id`) REFERENCES `procedures`(`procedure_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_report_procedures` ADD CONSTRAINT `daily_report_procedures_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `daily_reports`(`report_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_reports` ADD CONSTRAINT `daily_reports_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `laboratories`(`lab_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_reports` ADD CONSTRAINT `daily_reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_campus_id_fkey` FOREIGN KEY (`campus_id`) REFERENCES `campuses`(`campus_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_office_type_id_fkey` FOREIGN KEY (`office_type_id`) REFERENCES `office_types`(`type_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipment_borrows` ADD CONSTRAINT `equipment_borrows_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_assets` ADD CONSTRAINT `inventory_assets_added_by_user_id_fkey` FOREIGN KEY (`added_by_user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_assets` ADD CONSTRAINT `inventory_assets_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `laboratories`(`lab_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_assets` ADD CONSTRAINT `inventory_assets_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`unit_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_assets` ADD CONSTRAINT `inventory_assets_workstation_id_fkey` FOREIGN KEY (`workstation_id`) REFERENCES `workstations`(`workstation_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `laboratories` ADD CONSTRAINT `fk_lab_dept` FOREIGN KEY (`dept_id`) REFERENCES `departments`(`dept_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `one_time_links` ADD CONSTRAINT `one_time_links_generated_by_fkey` FOREIGN KEY (`generated_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pmc_report_procedures` ADD CONSTRAINT `pmc_report_procedures_pmc_id_fkey` FOREIGN KEY (`pmc_id`) REFERENCES `pmc_reports`(`pmc_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pmc_report_procedures` ADD CONSTRAINT `pmc_report_procedures_procedure_id_fkey` FOREIGN KEY (`procedure_id`) REFERENCES `procedures`(`procedure_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pmc_reports` ADD CONSTRAINT `pmc_reports_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `laboratories`(`lab_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pmc_reports` ADD CONSTRAINT `pmc_reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pmc_reports` ADD CONSTRAINT `pmc_reports_workstation_id_fkey` FOREIGN KEY (`workstation_id`) REFERENCES `workstations`(`workstation_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_workstation_items` ADD CONSTRAINT `report_workstation_items_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `daily_reports`(`report_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_workstation_items` ADD CONSTRAINT `report_workstation_items_workstation_id_fkey` FOREIGN KEY (`workstation_id`) REFERENCES `workstations`(`workstation_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_requests` ADD CONSTRAINT `lab_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_log_assets` ADD CONSTRAINT `service_log_assets_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `inventory_assets`(`asset_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_log_assets` ADD CONSTRAINT `service_log_assets_log_id_fkey` FOREIGN KEY (`log_id`) REFERENCES `service_logs`(`log_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_log_procedures` ADD CONSTRAINT `service_log_procedures_log_id_fkey` FOREIGN KEY (`log_id`) REFERENCES `service_logs`(`log_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_log_procedures` ADD CONSTRAINT `service_log_procedures_procedure_id_fkey` FOREIGN KEY (`procedure_id`) REFERENCES `procedures`(`procedure_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_logs` ADD CONSTRAINT `service_logs_performed_by_fkey` FOREIGN KEY (`performed_by`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_logs` ADD CONSTRAINT `service_logs_pmc_id_fkey` FOREIGN KEY (`pmc_id`) REFERENCES `pmc_reports`(`pmc_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `software_installations` ADD CONSTRAINT `software_installations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `units` ADD CONSTRAINT `units_device_type_id_fkey` FOREIGN KEY (`device_type_id`) REFERENCES `device_types`(`device_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `laboratories`(`lab_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workstations` ADD CONSTRAINT `workstations_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `laboratories`(`lab_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workstations` ADD CONSTRAINT `workstations_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `asset_statuses`(`status_id`) ON DELETE SET NULL ON UPDATE CASCADE;
