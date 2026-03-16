-- CreateTable
CREATE TABLE `cit_lab_logs` (
    `log_id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `usage_type` VARCHAR(20) NOT NULL,
    `faculty_student_name` VARCHAR(100) NOT NULL,
    `year_level` VARCHAR(20) NULL,
    `laboratory` VARCHAR(20) NOT NULL,
    `printing_pages` VARCHAR(50) NULL,
    `ws_number` VARCHAR(50) NULL,
    `purpose` TEXT NOT NULL,
    `monitored_by` VARCHAR(100) NULL,
    `user_type` VARCHAR(20) NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `cit_lab_logs_created_at_idx`(`created_at`),
    INDEX `cit_lab_logs_laboratory_idx`(`laboratory`),
    INDEX `cit_lab_logs_date_idx`(`date`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
