SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for _prisma_migrations
-- ----------------------------
DROP TABLE IF EXISTS `_prisma_migrations`;
CREATE TABLE `_prisma_migrations`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) NULL DEFAULT NULL,
  `migration_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `rolled_back_at` datetime(3) NULL DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of _prisma_migrations
-- ----------------------------
INSERT INTO `_prisma_migrations` VALUES ('cd32dbe3-44fb-438a-a4d6-f3be8675939f', '030b766d3aff1795641576f4bd7396c43caf1e63fd919b7b2134effbe1356ba0', '2026-01-29 01:53:33.475', '20260129015330_remove_item_name', NULL, NULL, '2026-01-29 01:53:30.656', 1);

-- ----------------------------
-- Table structure for campuses
-- ----------------------------
DROP TABLE IF EXISTS `campuses`;
CREATE TABLE `campuses`  (
  `campus_id` int NOT NULL AUTO_INCREMENT,
  `campus_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`campus_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of campuses
-- ----------------------------
INSERT INTO `campuses` VALUES (1, 'Main Campus');
INSERT INTO `campuses` VALUES (2, 'Paseo Campus');
INSERT INTO `campuses` VALUES (3, 'RNP Campus');

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
  INDEX `office_type_id`(`office_type_id` ASC) USING BTREE,
  CONSTRAINT `departments_campus_id_fkey` FOREIGN KEY (`campus_id`) REFERENCES `campuses` (`campus_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `departments_office_type_id_fkey` FOREIGN KEY (`office_type_id`) REFERENCES `office_types` (`type_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of departments
-- ----------------------------
INSERT INTO `departments` VALUES (1, 'College of Information Technology', 1, 1, 'Dean IT');
INSERT INTO `departments` VALUES (2, 'College of Pharmacy', 2, 1, 'Dean Pharmacy');
INSERT INTO `departments` VALUES (3, 'Junior High School', 3, 1, 'JHS Principal');
INSERT INTO `departments` VALUES (4, 'Senior High School', 1, 1, 'SHS Principal');

-- ----------------------------
-- Table structure for office_types
-- ----------------------------
DROP TABLE IF EXISTS `office_types`;
CREATE TABLE `office_types`  (
  `type_id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`type_id`) USING BTREE,
  UNIQUE INDEX `type_name`(`type_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of office_types
-- ----------------------------
INSERT INTO `office_types` VALUES (1, 'ACADEMIC');
INSERT INTO `office_types` VALUES (3, 'ADMINISTRATIVE');
INSERT INTO `office_types` VALUES (2, 'SUPPORT SERVICE');

-- ----------------------------
-- Table structure for device_types
-- ----------------------------
DROP TABLE IF EXISTS `device_types`;
CREATE TABLE `device_types`  (
  `device_type_id` int NOT NULL AUTO_INCREMENT,
  `device_type_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`device_type_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of device_types
-- ----------------------------
INSERT INTO `device_types` VALUES (1, 'PC Devices');
INSERT INTO `device_types` VALUES (2, 'Network Devices');
INSERT INTO `device_types` VALUES (3, 'Other Devices');

-- ----------------------------
-- Table structure for units
-- ----------------------------
DROP TABLE IF EXISTS `units`;
CREATE TABLE `units`  (
  `unit_id` int NOT NULL AUTO_INCREMENT,
  `unit_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_type_id` int NOT NULL,
  PRIMARY KEY (`unit_id`) USING BTREE,
  INDEX `device_type_id`(`device_type_id` ASC) USING BTREE,
  CONSTRAINT `units_device_type_id_fkey` FOREIGN KEY (`device_type_id`) REFERENCES `device_types` (`device_type_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of units
-- ----------------------------
INSERT INTO `units` VALUES (1, 'SSD', 1);
INSERT INTO `units` VALUES (2, 'Hard Disk Drive', 1);
INSERT INTO `units` VALUES (3, 'Mouse', 1);
INSERT INTO `units` VALUES (4, 'Monitor', 1);
INSERT INTO `units` VALUES (5, 'Keyboard', 1);
INSERT INTO `units` VALUES (6, 'AVR', 1);
INSERT INTO `units` VALUES (7, 'PSU', 1);
INSERT INTO `units` VALUES (8, 'RAM', 1);
INSERT INTO `units` VALUES (9, 'CPU', 1);
INSERT INTO `units` VALUES (10, 'Case', 1);
INSERT INTO `units` VALUES (11, 'Router', 2);
INSERT INTO `units` VALUES (12, 'Switch', 2);
INSERT INTO `units` VALUES (13, 'Printer', 3);
INSERT INTO `units` VALUES (14, 'Smart TV', 3);
INSERT INTO `units` VALUES (15, 'Projector', 3);

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
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of laboratories
-- ----------------------------
INSERT INTO `laboratories` VALUES (1, 'CIT-Lab 1', 'WAC Building 3rd Floor', 1, 4);
INSERT INTO `laboratories` VALUES (2, 'CIT-Lab 2', 'WAC Building 3rd Floor', 1, 3);
INSERT INTO `laboratories` VALUES (3, 'CIT-CISCO Lab', 'WAC Building 2nd Floor', 1, NULL);

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
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'CIT Administrator', 'admin@cit.edu', '$2b$10$qwOz6n8zeidC/I6HZQC67uCmhnnjSzM3VrR/IOHym6omHatLYdr1O', 'Admin', '2026-01-29 01:53:47', NULL);
INSERT INTO `users` VALUES (3, 'Jes Masuangat', 'jes@cit.edu', '$2b$10$yrbKUzWlL4s/fQyATkiVeOqWu2RLzZ3uBRE7We4ICZe5Rjhz/dMZO', 'Custodian', '2026-01-29 02:05:28', 2);
INSERT INTO `users` VALUES (4, 'Kyle Rana', 'kyle@cit.edu', '$2b$10$n4iM/hsdbJhYWU7/ubkDoeNAdEcPkanxeDOIUhHsV4fr0asjcXyee', 'Custodian', '2026-01-29 09:02:09', 1);
INSERT INTO `users` VALUES (5, 'Jun Brian', 'jun@cit.edu', '$2b$10$o3iyFrNcSZA9V1u9eR/lt.FLp7hPNPiz0ktPEXfxTWYqKaehz6u5q', 'Admin', '2026-01-29 09:02:51', NULL);

-- ----------------------------
-- Table structure for workstations
-- ----------------------------
DROP TABLE IF EXISTS `workstations`;
CREATE TABLE `workstations`  (
  `workstation_id` int NOT NULL AUTO_INCREMENT,
  `workstation_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `lab_id` int NULL DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`workstation_id`) USING BTREE,
  UNIQUE INDEX `workstations_workstation_name_lab_id_key`(`workstation_name` ASC, `lab_id` ASC) USING BTREE,
  INDEX `workstations_lab_id_idx`(`lab_id` ASC) USING BTREE,
  CONSTRAINT `workstations_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `laboratories` (`lab_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of workstations
-- ----------------------------
INSERT INTO `workstations` VALUES (1, 'WS-PC1', 2, '2026-01-29 02:06:48.086');
INSERT INTO `workstations` VALUES (2, 'WS-PC2', 2, '2026-01-29 02:06:48.086');
INSERT INTO `workstations` VALUES (6, 'WS-PC3', 2, '2026-01-29 07:14:48.096');

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
) ENGINE = InnoDB AUTO_INCREMENT = 55 CHARACTER SET = utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of inventory_assets
-- ----------------------------
INSERT INTO `inventory_assets` VALUES (45, 2, 1, 3, 3, '2026-01-29 02:26:37');
INSERT INTO `inventory_assets` VALUES (46, 2, 1, 4, 3, '2026-01-29 02:26:37');
INSERT INTO `inventory_assets` VALUES (47, 2, NULL, 13, 3, '2026-01-29 02:27:56');
INSERT INTO `inventory_assets` VALUES (48, 2, NULL, 11, 3, '2026-01-29 02:27:56');
INSERT INTO `inventory_assets` VALUES (49, 2, 2, 10, 3, '2026-01-29 07:40:58');
INSERT INTO `inventory_assets` VALUES (50, 2, 2, 6, 3, '2026-01-29 07:40:58');
INSERT INTO `inventory_assets` VALUES (51, 2, 2, 2, 3, '2026-01-29 07:40:58');
INSERT INTO `inventory_assets` VALUES (52, 2, 6, 3, 3, '2026-01-29 07:42:15');
INSERT INTO `inventory_assets` VALUES (53, 2, 6, 8, 3, '2026-01-29 07:42:15');
INSERT INTO `inventory_assets` VALUES (54, 2, NULL, 14, 3, '2026-01-29 08:54:20');

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
  PRIMARY KEY (`detail_id`) USING BTREE,
  UNIQUE INDEX `asset_details_asset_id_key`(`asset_id` ASC) USING BTREE,
  UNIQUE INDEX `property_tag_no`(`property_tag_no` ASC) USING BTREE,
  CONSTRAINT `asset_details_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `inventory_assets` (`asset_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 55 CHARACTER SET = utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of asset_details
-- ----------------------------
INSERT INTO `asset_details` VALUES (45, 45, '123', 1, 'Mouse Desc', '123', '2026-01-21');
INSERT INTO `asset_details` VALUES (46, 46, '132', 1, 'Monitor Desc', '132', '2026-01-20');
INSERT INTO `asset_details` VALUES (47, 47, '441234', 1, 'Borther Printer', '441234', '2026-01-21');
INSERT INTO `asset_details` VALUES (48, 48, '441626', 1, 'Tenda Router', '113532', '2026-01-21');
INSERT INTO `asset_details` VALUES (49, 49, 'TAG-333', 1, 'Case ATX', 'SN-3312', '2026-01-21');
INSERT INTO `asset_details` VALUES (50, 50, 'TAG-3112', 1, 'AVR desc', 'SN-321', '2026-01-20');
INSERT INTO `asset_details` VALUES (51, 51, 'TAG-331412', 1, 'HDD Desc', 'SN-31554', NULL);
INSERT INTO `asset_details` VALUES (52, 52, 'TAG-554', 1, 'Desc', 'SN-144', '2025-12-31');
INSERT INTO `asset_details` VALUES (53, 53, 'CIT-1112', 1, 'Desc RAM', 'SN-551', '2026-01-06');
INSERT INTO `asset_details` VALUES (54, 54, '535624', 1, 'Smart TV desc', '11123', '2026-01-20');

-- ----------------------------
-- Table structure for daily_reports
-- ----------------------------
DROP TABLE IF EXISTS `daily_reports`;
CREATE TABLE `daily_reports`  (
  `report_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `lab_id` int NOT NULL,
  `report_date` date NOT NULL,
  `time_in` time NULL DEFAULT NULL,
  `time_out` time NULL DEFAULT NULL,
  `general_remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `status` enum('Pending','Submitted','Approved') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`) USING BTREE,
  INDEX `lab_id`(`lab_id` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `daily_reports_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `laboratories` (`lab_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `daily_reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of daily_reports
-- ----------------------------

-- ----------------------------
-- Table structure for standard_tasks
-- ----------------------------
DROP TABLE IF EXISTS `standard_tasks`;
CREATE TABLE `standard_tasks`  (
  `task_id` int NOT NULL AUTO_INCREMENT,
  `task_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`task_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of standard_tasks
-- ----------------------------

-- ----------------------------
-- Table structure for report_checklist_items
-- ----------------------------
DROP TABLE IF EXISTS `report_checklist_items`;
CREATE TABLE `report_checklist_items`  (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `report_id` int NOT NULL,
  `task_id` int NOT NULL,
  `task_status` enum('Done','Issue Found','N/A') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'Done',
  `specific_remarks` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`item_id`) USING BTREE,
  INDEX `report_id`(`report_id` ASC) USING BTREE,
  INDEX `task_id`(`task_id` ASC) USING BTREE,
  CONSTRAINT `report_checklist_items_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `daily_reports` (`report_id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `report_checklist_items_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `standard_tasks` (`task_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of report_checklist_items
-- ----------------------------

SET FOREIGN_KEY_CHECKS = 1;
