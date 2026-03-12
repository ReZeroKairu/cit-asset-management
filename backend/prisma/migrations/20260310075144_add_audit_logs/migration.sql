-- AlterTable
ALTER TABLE `complaints` ADD COLUMN `ip_address` VARCHAR(45) NULL;

-- AlterTable
ALTER TABLE `equipment_borrows` ADD COLUMN `ip_address` VARCHAR(45) NULL;

-- AlterTable
ALTER TABLE `lab_requests` ADD COLUMN `ip_address` VARCHAR(45) NULL;

-- AlterTable
ALTER TABLE `software_installations` ADD COLUMN `ip_address` VARCHAR(45) NULL;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
