-- AlterTable
ALTER TABLE `equipment_borrows` MODIFY `status` ENUM('Pending', 'Admin_Approved', 'Custodian_Approved', 'Denied', 'Returned', 'Lost') NOT NULL DEFAULT 'Pending';
