-- DropIndex
DROP INDEX `pmc_reports_workstation_id_quarter_key` ON `pmc_reports`;

-- AlterTable
ALTER TABLE `asset_details` ADD COLUMN `date_disposed` DATE NULL;

-- CreateTable
CREATE TABLE `maintenance_schedules` (
    `schedule_id` INTEGER NOT NULL AUTO_INCREMENT,
    `lab_id` INTEGER NOT NULL,
    `quarter` VARCHAR(20) NOT NULL,
    `fiscal_year` VARCHAR(20) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `servicing_weeks` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `maintenance_schedules_lab_id_idx`(`lab_id`),
    INDEX `maintenance_schedules_quarter_idx`(`quarter`),
    INDEX `maintenance_schedules_fiscal_year_idx`(`fiscal_year`),
    UNIQUE INDEX `maintenance_schedules_lab_id_quarter_fiscal_year_key`(`lab_id`, `quarter`, `fiscal_year`),
    PRIMARY KEY (`schedule_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `maintenance_schedules` ADD CONSTRAINT `maintenance_schedules_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `laboratories`(`lab_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
