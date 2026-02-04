/*
 Navicat Premium Data Transfer

 Source Server         : CIT Asset Management
 Source Server Type    : MySQL
 Source Server Version : 90600 (9.6.0)
 Source Host           : 127.0.0.1:3306
 Source Schema         : cit_asset_management

 Target Server Type    : MySQL
 Target Server Version : 90600 (9.6.0)
 File Encoding         : 65001

 Date: 04/02/2026 10:24:08
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for _prisma_migrations
-- ----------------------------
DROP TABLE IF EXISTS `_prisma_migrations`;
CREATE TABLE `_prisma_migrations`  ();

-- ----------------------------
-- Table structure for asset_details
-- ----------------------------
DROP TABLE IF EXISTS `asset_details`;
CREATE TABLE `asset_details`  (
  `detail_id` int NOT NULL AUTO_INCREMENT,
  `asset_id` int NOT NULL,
  `property_tag_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `quantity` int NULL DEFAULT 1,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `serial_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `date_of_purchase` date NULL DEFAULT NULL,
  `asset_remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `status_id` int NULL DEFAULT 1,
  PRIMARY KEY (`detail_id`) USING BTREE,
  UNIQUE INDEX `asset_details_asset_id_key`(`asset_id` ASC) USING BTREE,
  UNIQUE INDEX `property_tag_no`(`property_tag_no` ASC) USING BTREE,
  INDEX `asset_details_status_id_idx`(`status_id` ASC) USING BTREE,
  CONSTRAINT `asset_details_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `inventory_assets` (`asset_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `asset_details_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `asset_statuses` (`status_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for asset_statuses
-- ----------------------------
DROP TABLE IF EXISTS `asset_statuses`;
CREATE TABLE `asset_statuses`  (
  `status_id` int NOT NULL AUTO_INCREMENT,
  `status_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`status_id`) USING BTREE,
  UNIQUE INDEX `asset_statuses_status_name_key`(`status_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for campuses
-- ----------------------------
DROP TABLE IF EXISTS `campuses`;
CREATE TABLE `campuses`  (
  `campus_id` int NOT NULL AUTO_INCREMENT,
  `campus_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`campus_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for daily_report_checklist_responses
-- ----------------------------
DROP TABLE IF EXISTS `daily_report_checklist_responses`;
CREATE TABLE `daily_report_checklist_responses`  (
  `response_id` int NOT NULL AUTO_INCREMENT,
  `report_procedure_id` int NOT NULL,
  `checklist_id` int NOT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Done',
  `remarks` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`response_id`) USING BTREE,
  INDEX `checklist_id`(`checklist_id` ASC) USING BTREE,
  INDEX `report_procedure_id`(`report_procedure_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for daily_report_procedures
-- ----------------------------
DROP TABLE IF EXISTS `daily_report_procedures`;
CREATE TABLE `daily_report_procedures`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_id` int NOT NULL,
  `procedure_id` int NOT NULL,
  `overall_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `overall_remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `procedure_id`(`procedure_id` ASC) USING BTREE,
  INDEX `report_id`(`report_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for daily_reports
-- ----------------------------
DROP TABLE IF EXISTS `daily_reports`;
CREATE TABLE `daily_reports`  (
  `report_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `lab_id` int NOT NULL,
  `report_date` date NOT NULL,
  `general_remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `status` enum('Pending','Approved') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`) USING BTREE,
  INDEX `lab_id`(`lab_id` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_daily_reports_lab` FOREIGN KEY (`lab_id`) REFERENCES `laboratories` (`lab_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_daily_reports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 18 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for departments
-- ----------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments`  (
  `dept_id` int NOT NULL AUTO_INCREMENT,
  `dept_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `campus_id` int NULL DEFAULT NULL,
  `office_type_id` int NULL DEFAULT NULL,
  `designee_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`dept_id`) USING BTREE,
  INDEX `campus_id`(`campus_id` ASC) USING BTREE,
  INDEX `office_type_id`(`office_type_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for device_types
-- ----------------------------
DROP TABLE IF EXISTS `device_types`;
CREATE TABLE `device_types`  (
  `device_type_id` int NOT NULL AUTO_INCREMENT,
  `device_type_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`device_type_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for inventory_assets
-- ----------------------------
DROP TABLE IF EXISTS `inventory_assets`;
CREATE TABLE `inventory_assets`  (
  `asset_id` int NOT NULL AUTO_INCREMENT,
  `lab_id` int NULL DEFAULT NULL,
  `workstation_id` int NULL DEFAULT NULL,
  `unit_id` int NULL DEFAULT NULL,
  `added_by_user_id` int NULL DEFAULT NULL,
  `date_added` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`asset_id`) USING BTREE,
  INDEX `added_by_user_id`(`added_by_user_id` ASC) USING BTREE,
  INDEX `lab_id`(`lab_id` ASC) USING BTREE,
  INDEX `unit_id`(`unit_id` ASC) USING BTREE,
  INDEX `inventory_assets_workstation_id_idx`(`workstation_id` ASC) USING BTREE,
  CONSTRAINT `inventory_assets_added_by_user_id_fkey` FOREIGN KEY (`added_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `inventory_assets_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `laboratories` (`lab_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `inventory_assets_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units` (`unit_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `inventory_assets_workstation_id_fkey` FOREIGN KEY (`workstation_id`) REFERENCES `workstations` (`workstation_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for laboratories
-- ----------------------------
DROP TABLE IF EXISTS `laboratories`;
CREATE TABLE `laboratories`  (
  `lab_id` int NOT NULL AUTO_INCREMENT,
  `lab_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `dept_id` int NULL DEFAULT NULL,
  `in_charge_id` int NULL DEFAULT NULL,
  PRIMARY KEY (`lab_id`) USING BTREE,
  INDEX `dept_id`(`dept_id` ASC) USING BTREE,
  INDEX `laboratories_in_charge_id_idx`(`in_charge_id` ASC) USING BTREE,
  CONSTRAINT `fk_lab_dept` FOREIGN KEY (`dept_id`) REFERENCES `departments` (`dept_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `laboratories_in_charge_id_fkey` FOREIGN KEY (`in_charge_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for office_types
-- ----------------------------
DROP TABLE IF EXISTS `office_types`;
CREATE TABLE `office_types`  (
  `type_id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`type_id`) USING BTREE,
  UNIQUE INDEX `type_name`(`type_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for procedure_checklists
-- ----------------------------
DROP TABLE IF EXISTS `procedure_checklists`;
CREATE TABLE `procedure_checklists`  (
  `checklist_id` int NOT NULL AUTO_INCREMENT,
  `procedure_id` int NOT NULL,
  `checklist_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `order_sequence` int NOT NULL DEFAULT 0,
  `is_required` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`checklist_id`) USING BTREE,
  INDEX `procedure_id`(`procedure_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 22 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for procedures
-- ----------------------------
DROP TABLE IF EXISTS `procedures`;
CREATE TABLE `procedures`  (
  `procedure_id` int NOT NULL AUTO_INCREMENT,
  `procedure_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`procedure_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for report_workstation_items
-- ----------------------------
DROP TABLE IF EXISTS `report_workstation_items`;
CREATE TABLE `report_workstation_items`  (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `report_id` int NOT NULL,
  `workstation_id` int NOT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Working',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`) USING BTREE,
  INDEX `report_id`(`report_id` ASC) USING BTREE,
  INDEX `workstation_id`(`workstation_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for task_categories
-- ----------------------------
DROP TABLE IF EXISTS `task_categories`;
CREATE TABLE `task_categories`  (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`category_id`) USING BTREE,
  UNIQUE INDEX `task_categories_category_name_key`(`category_name` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for units
-- ----------------------------
DROP TABLE IF EXISTS `units`;
CREATE TABLE `units`  (
  `unit_id` int NOT NULL AUTO_INCREMENT,
  `unit_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_type_id` int NOT NULL,
  PRIMARY KEY (`unit_id`) USING BTREE,
  INDEX `device_type_id`(`device_type_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('Admin','Custodian') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'Custodian',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `lab_id` int NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`) USING BTREE,
  UNIQUE INDEX `email`(`email` ASC) USING BTREE,
  INDEX `users_lab_id_fkey`(`lab_id` ASC) USING BTREE,
  CONSTRAINT `users_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `laboratories` (`lab_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for workstations
-- ----------------------------
DROP TABLE IF EXISTS `workstations`;
CREATE TABLE `workstations`  (
  `workstation_id` int NOT NULL AUTO_INCREMENT,
  `workstation_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `lab_id` int NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `workstation_remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `status_id` int NULL DEFAULT 1,
  PRIMARY KEY (`workstation_id`) USING BTREE,
  UNIQUE INDEX `workstations_workstation_name_lab_id_key`(`workstation_name` ASC, `lab_id` ASC) USING BTREE,
  INDEX `workstations_lab_id_idx`(`lab_id` ASC) USING BTREE,
  INDEX `workstations_status_id_idx`(`status_id` ASC) USING BTREE,
  CONSTRAINT `workstations_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `laboratories` (`lab_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `workstations_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `asset_statuses` (`status_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
