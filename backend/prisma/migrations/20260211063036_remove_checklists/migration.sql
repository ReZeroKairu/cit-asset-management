/*
  Warnings:

  - You are about to drop the column `time_in` on the `daily_reports` table. All the data in the column will be lost.
  - You are about to drop the column `time_out` on the `daily_reports` table. All the data in the column will be lost.
  - The values [Submitted] on the enum `daily_reports_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `report_checklist_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `standard_tasks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `laboratories` DROP FOREIGN KEY `laboratories_in_charge_id_fkey`;

-- DropForeignKey
ALTER TABLE `report_checklist_items` DROP FOREIGN KEY `report_checklist_items_report_id_fkey`;

-- DropForeignKey
ALTER TABLE `report_checklist_items` DROP FOREIGN KEY `report_checklist_items_task_id_fkey`;

-- AlterTable
ALTER TABLE `asset_details` ADD COLUMN `asset_remarks` TEXT NULL,
    ADD COLUMN `status_id` INTEGER NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `daily_reports` DROP COLUMN `time_in`,
    DROP COLUMN `time_out`,
    ADD COLUMN `report_type` VARCHAR(191) NOT NULL DEFAULT 'DAILY',
    MODIFY `status` ENUM('Pending', 'Approved') NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE `workstations` ADD COLUMN `status_id` INTEGER NULL DEFAULT 1,
    ADD COLUMN `workstation_remarks` TEXT NULL;

-- DropTable
DROP TABLE `report_checklist_items`;

-- DropTable
DROP TABLE `standard_tasks`;

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

-- CreateIndex
CREATE INDEX `asset_details_status_id_idx` ON `asset_details`(`status_id`);

-- CreateIndex
CREATE INDEX `workstations_status_id_idx` ON `workstations`(`status_id`);

-- AddForeignKey
ALTER TABLE `workstations` ADD CONSTRAINT `workstations_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `asset_statuses`(`status_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `asset_details` ADD CONSTRAINT `asset_details_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `asset_statuses`(`status_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `daily_report_procedures` ADD CONSTRAINT `daily_report_procedures_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `daily_reports`(`report_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `daily_report_procedures` ADD CONSTRAINT `daily_report_procedures_procedure_id_fkey` FOREIGN KEY (`procedure_id`) REFERENCES `procedures`(`procedure_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `report_workstation_items` ADD CONSTRAINT `report_workstation_items_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `daily_reports`(`report_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `report_workstation_items` ADD CONSTRAINT `report_workstation_items_workstation_id_fkey` FOREIGN KEY (`workstation_id`) REFERENCES `workstations`(`workstation_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
