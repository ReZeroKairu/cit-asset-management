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
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pmc_reports_lab_id_idx`(`lab_id`),
    INDEX `pmc_reports_workstation_id_idx`(`workstation_id`),
    INDEX `pmc_reports_user_id_idx`(`user_id`),
    PRIMARY KEY (`pmc_id`)
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

-- AddForeignKey
ALTER TABLE `pmc_reports` ADD CONSTRAINT `pmc_reports_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `laboratories`(`lab_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pmc_reports` ADD CONSTRAINT `pmc_reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pmc_reports` ADD CONSTRAINT `pmc_reports_workstation_id_fkey` FOREIGN KEY (`workstation_id`) REFERENCES `workstations`(`workstation_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pmc_report_procedures` ADD CONSTRAINT `pmc_report_procedures_pmc_id_fkey` FOREIGN KEY (`pmc_id`) REFERENCES `pmc_reports`(`pmc_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pmc_report_procedures` ADD CONSTRAINT `pmc_report_procedures_procedure_id_fkey` FOREIGN KEY (`procedure_id`) REFERENCES `procedures`(`procedure_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
