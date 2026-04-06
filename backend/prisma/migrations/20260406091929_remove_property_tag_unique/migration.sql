/*
  Warnings:

  - You are about to drop the `one_time_links` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `one_time_links` DROP FOREIGN KEY `one_time_links_generated_by_fkey`;

-- DropIndex
DROP INDEX `property_tag_no` ON `asset_details`;

-- AlterTable
ALTER TABLE `asset_details` ADD COLUMN `disposed_by` VARCHAR(100) NULL;

-- DropTable
DROP TABLE `one_time_links`;
