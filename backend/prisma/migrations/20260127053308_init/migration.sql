-- CreateTable
CREATE TABLE `campuses` (
    `campus_id` INTEGER NOT NULL AUTO_INCREMENT,
    `campus_name` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`campus_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_reports` (
    `report_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `lab_id` INTEGER NOT NULL,
    `report_date` DATE NOT NULL,
    `time_in` TIME(0) NULL,
    `time_out` TIME(0) NULL,
    `general_remarks` TEXT NULL,
    `status` ENUM('Pending', 'Submitted', 'Approved', 'Rejected') NULL DEFAULT 'Pending',
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
CREATE TABLE `inventory_assets` (
    `asset_id` INTEGER NOT NULL AUTO_INCREMENT,
    `lab_id` INTEGER NULL,
    `workstation_number` VARCHAR(50) NULL,
    `unit_id` INTEGER NULL,
    `item_name` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `property_tag_no` VARCHAR(50) NULL,
    `serial_number` VARCHAR(100) NULL,
    `quantity` INTEGER NULL DEFAULT 1,
    `date_of_purchase` DATE NULL,
    `supplier_name` VARCHAR(100) NULL,
    `added_by_user_id` INTEGER NULL,
    `date_added` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `workstation_id` INTEGER NULL,

    UNIQUE INDEX `property_tag_no`(`property_tag_no`),
    INDEX `added_by_user_id`(`added_by_user_id`),
    INDEX `lab_id`(`lab_id`),
    INDEX `unit_id`(`unit_id`),
    INDEX `inventory_assets_workstation_id_idx`(`workstation_id`),
    PRIMARY KEY (`asset_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `laboratories` (
    `lab_id` INTEGER NOT NULL AUTO_INCREMENT,
    `lab_name` VARCHAR(50) NOT NULL,
    `location` VARCHAR(50) NULL,
    `dept_id` INTEGER NULL,
    `lab_in_charge` VARCHAR(100) NULL,

    INDEX `dept_id`(`dept_id`),
    PRIMARY KEY (`lab_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_checklist_items` (
    `item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `report_id` INTEGER NOT NULL,
    `task_id` INTEGER NOT NULL,
    `task_status` ENUM('Done', 'Issue Found', 'N/A') NULL DEFAULT 'Done',
    `specific_remarks` VARCHAR(255) NULL,

    INDEX `report_id`(`report_id`),
    INDEX `task_id`(`task_id`),
    PRIMARY KEY (`item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `standard_tasks` (
    `task_id` INTEGER NOT NULL AUTO_INCREMENT,
    `task_name` VARCHAR(100) NOT NULL,
    `category` VARCHAR(50) NULL,

    PRIMARY KEY (`task_id`)
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
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `device_types` (
    `device_type_id` INTEGER NOT NULL AUTO_INCREMENT,
    `device_type_name` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`device_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `office_types` (
    `type_id` INTEGER NOT NULL AUTO_INCREMENT,
    `type_name` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `type_name`(`type_name`),
    PRIMARY KEY (`type_id`)
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
CREATE TABLE `workstations` (
    `workstation_id` INTEGER NOT NULL AUTO_INCREMENT,
    `workstation_name` VARCHAR(191) NOT NULL,
    `lab_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `workstations_workstation_name_key`(`workstation_name`),
    INDEX `workstations_lab_id_idx`(`lab_id`),
    PRIMARY KEY (`workstation_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `daily_reports` ADD CONSTRAINT `daily_reports_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `daily_reports` ADD CONSTRAINT `daily_reports_ibfk_2` FOREIGN KEY (`lab_id`) REFERENCES `laboratories`(`lab_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`campus_id`) REFERENCES `campuses`(`campus_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_ibfk_2` FOREIGN KEY (`office_type_id`) REFERENCES `office_types`(`type_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `inventory_assets` ADD CONSTRAINT `inventory_assets_ibfk_1` FOREIGN KEY (`lab_id`) REFERENCES `laboratories`(`lab_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `inventory_assets` ADD CONSTRAINT `inventory_assets_ibfk_2` FOREIGN KEY (`unit_id`) REFERENCES `units`(`unit_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `inventory_assets` ADD CONSTRAINT `inventory_assets_ibfk_3` FOREIGN KEY (`added_by_user_id`) REFERENCES `users`(`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `inventory_assets` ADD CONSTRAINT `inventory_assets_workstation_id_fkey` FOREIGN KEY (`workstation_id`) REFERENCES `workstations`(`workstation_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `laboratories` ADD CONSTRAINT `fk_lab_dept` FOREIGN KEY (`dept_id`) REFERENCES `departments`(`dept_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `report_checklist_items` ADD CONSTRAINT `report_checklist_items_ibfk_1` FOREIGN KEY (`report_id`) REFERENCES `daily_reports`(`report_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `report_checklist_items` ADD CONSTRAINT `report_checklist_items_ibfk_2` FOREIGN KEY (`task_id`) REFERENCES `standard_tasks`(`task_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `laboratories`(`lab_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `units` ADD CONSTRAINT `units_ibfk_1` FOREIGN KEY (`device_type_id`) REFERENCES `device_types`(`device_type_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `workstations` ADD CONSTRAINT `workstations_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `laboratories`(`lab_id`) ON DELETE SET NULL ON UPDATE CASCADE;
