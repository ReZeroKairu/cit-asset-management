import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export { prisma };

export const initializeFormsTables = async () => {
  try {
    // Check if tables exist by attempting a simple query
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM lab_requests LIMIT 1`;
      console.log('✅ Lab requests table exists');
    } catch (error) {
      console.log('❌ Lab requests table does not exist, creating...');
      // Create lab_requests table manually
      await prisma.$queryRaw`
        CREATE TABLE IF NOT EXISTS lab_requests (
          request_id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          date DATE NOT NULL,
          usage_type VARCHAR(20) NOT NULL,
          faculty_student_name VARCHAR(100) NOT NULL,
          year_level VARCHAR(20) NULL,
          laboratory VARCHAR(20) NOT NULL,
          printing_pages VARCHAR(50) NULL,
          ws_number VARCHAR(50) NULL,
          time_in VARCHAR(10) NULL,
          time_out VARCHAR(10) NULL,
          purpose TEXT NOT NULL,
          requested_by VARCHAR(100) NOT NULL,
          remarks TEXT NULL,
          monitored_by VARCHAR(100) NULL,
          status ENUM('Pending', 'Admin_Approved', 'Custodian_Approved', 'Denied') DEFAULT 'Pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX (user_id)
        )
      `;
      console.log('✅ Lab requests table created');
    }

    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM equipment_borrows LIMIT 1`;
      console.log('✅ Equipment borrows table exists');
    } catch (error) {
      console.log('❌ Equipment borrows table does not exist, creating...');
      await prisma.$queryRaw`
        CREATE TABLE IF NOT EXISTS equipment_borrows (
          borrow_id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          date DATE NOT NULL,
          laboratory VARCHAR(20) NOT NULL,
          faculty_student_name VARCHAR(100) NOT NULL,
          year_level VARCHAR(20) NULL,
          release_time VARCHAR(10) NOT NULL,
          returned_time VARCHAR(10) NULL,
          equipment_list JSON NOT NULL,
          purpose TEXT NOT NULL,
          requested_by VARCHAR(100) NOT NULL,
          remarks TEXT NULL,
          monitored_by VARCHAR(100) NULL,
          status ENUM('Pending', 'Admin_Approved', 'Custodian_Approved', 'Denied', 'Returned') DEFAULT 'Pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX (user_id)
        )
      `;
      console.log('✅ Equipment borrows table created');
    }

    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM software_installations LIMIT 1`;
      console.log('✅ Software installations table exists');
    } catch (error) {
      console.log('❌ Software installations table does not exist, creating...');
      await prisma.$queryRaw`
        CREATE TABLE IF NOT EXISTS software_installations (
          installation_id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          faculty_name VARCHAR(100) NOT NULL,
          date DATE NOT NULL,
          laboratory VARCHAR(20) NOT NULL,
          software_list TEXT NOT NULL,
          requested_by VARCHAR(100) NOT NULL,
          installation_remarks TEXT NULL,
          prepared_by VARCHAR(100) NULL,
          feedback_date DATE NULL,
          status ENUM('Pending', 'Admin_Approved', 'Custodian_Approved', 'Denied', 'Completed') DEFAULT 'Pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX (user_id)
        )
      `;
      console.log('✅ Software installations table created');
    }

    // Create missing reference tables
    const tables = [
      {
        name: 'asset_statuses',
        sql: `
          CREATE TABLE IF NOT EXISTS asset_statuses (
            status_id INT AUTO_INCREMENT PRIMARY KEY,
            status_name VARCHAR(50) NOT NULL
          )
        `
      },
      {
        name: 'campuses',
        sql: `
          CREATE TABLE IF NOT EXISTS campuses (
            campus_id INT AUTO_INCREMENT PRIMARY KEY,
            campus_name VARCHAR(100) NOT NULL
          )
        `
      },
      {
        name: 'office_types',
        sql: `
          CREATE TABLE IF NOT EXISTS office_types (
            type_id INT AUTO_INCREMENT PRIMARY KEY,
            type_name VARCHAR(50) NOT NULL
          )
        `
      },
      {
        name: 'departments',
        sql: `
          CREATE TABLE IF NOT EXISTS departments (
            dept_id INT AUTO_INCREMENT PRIMARY KEY,
            dept_name VARCHAR(100) NOT NULL,
            campus_id INT,
            office_type_id INT,
            designee_name VARCHAR(100),
            INDEX (campus_id),
            INDEX (office_type_id)
          )
        `
      },
      {
        name: 'device_types',
        sql: `
          CREATE TABLE IF NOT EXISTS device_types (
            device_type_id INT AUTO_INCREMENT PRIMARY KEY,
            device_type_name VARCHAR(50) NOT NULL
          )
        `
      },
      {
        name: 'units',
        sql: `
          CREATE TABLE IF NOT EXISTS units (
            unit_id INT AUTO_INCREMENT PRIMARY KEY,
            unit_name VARCHAR(100) NOT NULL,
            device_type_id INT,
            INDEX (device_type_id)
          )
        `
      },
      {
        name: 'laboratories',
        sql: `
          CREATE TABLE IF NOT EXISTS laboratories (
            lab_id INT AUTO_INCREMENT PRIMARY KEY,
            lab_name VARCHAR(100) NOT NULL,
            location VARCHAR(200),
            dept_id INT,
            in_charge_id INT,
            INDEX (dept_id),
            INDEX (in_charge_id)
          )
        `
      },
      {
        name: 'users',
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('Admin', 'Custodian') DEFAULT 'Custodian',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            lab_id INT,
            INDEX (lab_id)
          )
        `
      },
      {
        name: 'workstations',
        sql: `
          CREATE TABLE IF NOT EXISTS workstations (
            workstation_id INT AUTO_INCREMENT PRIMARY KEY,
            workstation_name VARCHAR(50) NOT NULL,
            lab_id INT,
            workstation_remarks TEXT,
            status_id INT,
            INDEX (lab_id),
            INDEX (status_id)
          )
        `
      },
      {
        name: 'procedures',
        sql: `
          CREATE TABLE IF NOT EXISTS procedures (
            procedure_id INT AUTO_INCREMENT PRIMARY KEY,
            procedure_name VARCHAR(100) NOT NULL,
            category VARCHAR(50),
            is_active BOOLEAN DEFAULT TRUE
          )
        `
      },
      {
        name: 'inventory_assets',
        sql: `
          CREATE TABLE IF NOT EXISTS inventory_assets (
            asset_id INT AUTO_INCREMENT PRIMARY KEY,
            lab_id INT,
            workstation_id INT,
            unit_id INT,
            added_by_user_id INT,
            INDEX (lab_id),
            INDEX (workstation_id),
            INDEX (unit_id),
            INDEX (added_by_user_id)
          )
        `
      },
      {
        name: 'asset_details',
        sql: `
          CREATE TABLE IF NOT EXISTS asset_details (
            detail_id INT AUTO_INCREMENT PRIMARY KEY,
            asset_id INT,
            property_tag_no VARCHAR(50),
            quantity INT DEFAULT 1,
            description TEXT,
            serial_number VARCHAR(100),
            date_of_purchase DATE,
            asset_remarks TEXT,
            status_id INT,
            INDEX (asset_id),
            INDEX (status_id)
          )
        `
      }
    ];

    for (const table of tables) {
      try {
        await prisma.$queryRaw`SELECT COUNT(*) FROM ${prisma.$queryRawUnsafe(table.name)} LIMIT 1`;
        console.log(`✅ ${table.name} table exists`);
      } catch (error) {
        console.log(`❌ ${table.name} table does not exist, creating...`);
        await prisma.$queryRawUnsafe(table.sql);
        console.log(`✅ ${table.name} table created`);
      }
    }

    console.log('🎉 Database initialization completed!');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    await prisma.$disconnect();
  }
};
