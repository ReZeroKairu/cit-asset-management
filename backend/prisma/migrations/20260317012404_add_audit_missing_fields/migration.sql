-- AlterTable
ALTER TABLE `audit_logs` ADD COLUMN `ip_address` VARCHAR(45) NULL,
    ADD COLUMN `user_agent` TEXT NULL;
