import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clean up existing data
  await prisma.daily_report_procedures.deleteMany();
  await prisma.daily_reports.deleteMany();
  await prisma.asset_details.deleteMany();
  await prisma.inventory_assets.deleteMany();
  await prisma.workstations.deleteMany();
  await prisma.users.deleteMany();
  await prisma.laboratories.deleteMany();
  await prisma.units.deleteMany();
  await prisma.device_types.deleteMany();
  await prisma.departments.deleteMany();
  await prisma.office_types.deleteMany();
  await prisma.campuses.deleteMany();
  await prisma.procedure_checklists.deleteMany();
  await prisma.procedures.deleteMany();

  // Create campuses
  const campuses = await Promise.all([
    prisma.campuses.create({ data: { campus_name: 'Main Campus' } }),
    prisma.campuses.create({ data: { campus_name: 'Paseo Campus' } }),
    prisma.campuses.create({ data: { campus_name: 'RNP Campus' } }),
  ]);

  // Create office types
  const officeTypes = await Promise.all([
    prisma.office_types.create({ data: { type_name: 'ACADEMIC' } }),
    prisma.office_types.create({ data: { type_name: 'SUPPORT SERVICE' } }),
    prisma.office_types.create({ data: { type_name: 'ADMINISTRATIVE' } }),
  ]);

  // Create departments
  const departments = await Promise.all([
    prisma.departments.create({ 
      data: { 
        dept_name: 'College of Information Technology', 
        campus_id: campuses[0].campus_id, 
        office_type_id: officeTypes[0].type_id,
        designee_name: 'Dean IT'
      } 
    }),
    prisma.departments.create({ 
      data: { 
        dept_name: 'College of Pharmacy', 
        campus_id: campuses[1].campus_id, 
        office_type_id: officeTypes[0].type_id,
        designee_name: 'Dean Pharmacy'
      } 
    }),
    prisma.departments.create({ 
      data: { 
        dept_name: 'Junior High School', 
        campus_id: campuses[2].campus_id, 
        office_type_id: officeTypes[0].type_id,
        designee_name: 'JHS Principal'
      } 
    }),
    prisma.departments.create({ 
      data: { 
        dept_name: 'Senior High School', 
        campus_id: campuses[0].campus_id, 
        office_type_id: officeTypes[0].type_id,
        designee_name: 'SHS Principal'
      } 
    }),
  ]);

  // Create device types
  const deviceTypes = await Promise.all([
    prisma.device_types.create({ data: { device_type_name: 'PC Devices' } }),
    prisma.device_types.create({ data: { device_type_name: 'Network Devices' } }),
    prisma.device_types.create({ data: { device_type_name: 'Other Devices' } }),
  ]);

  // Create procedures
  const procedures = await Promise.all([
    prisma.procedures.create({ 
      data: { 
        procedure_name: 'Hardware Checks', 
        description: 'Physical inspection and verification of hardware components',
        category: 'Hardware'
      } 
    }),
    prisma.procedures.create({ 
      data: { 
        procedure_name: 'Software Checks', 
        description: 'Verification of software functionality and updates',
        category: 'Software'
      } 
    }),
    prisma.procedures.create({ 
      data: { 
        procedure_name: 'Network & Connectivity Checks', 
        description: 'Testing network connections and internet access',
        category: 'Network'
      } 
    }),
    prisma.procedures.create({ 
      data: { 
        procedure_name: 'Cleanliness & Organization', 
        description: 'Maintaining clean and organized workstation area',
        category: 'Maintenance'
      } 
    }),
    prisma.procedures.create({ 
      data: { 
        procedure_name: 'User Management', 
        description: 'Managing user accounts and access permissions',
        category: 'Administration'
      } 
    }),
    prisma.procedures.create({ 
      data: { 
        procedure_name: 'Security & Safety', 
        description: 'Ensuring security protocols and safety measures',
        category: 'Security'
      } 
    }),
    prisma.procedures.create({ 
      data: { 
        procedure_name: 'End of Day Checks', 
        description: 'Final checks and shutdown procedures',
        category: 'Procedures'
      } 
    }),
  ]);

  // Create procedure checklists
  const procedureChecklists = await Promise.all([
    // Hardware Checks
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[0].procedure_id, checklist_name: 'Monitor power and display functionality', description: 'Check if monitor turns on and displays correctly', order_sequence: 1 } }),
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[0].procedure_id, checklist_name: 'CPU power and startup', description: 'Verify CPU powers on and boots properly', order_sequence: 2 } }),
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[0].procedure_id, checklist_name: 'Keyboard and mouse functionality', description: 'Test keyboard and mouse input devices', order_sequence: 3 } }),
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[0].procedure_id, checklist_name: 'Printer and peripheral devices', description: 'Check printer and other connected devices', order_sequence: 4 } }),
    
    // Software Checks
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[1].procedure_id, checklist_name: 'Operating system updates', description: 'Check for and install OS updates if needed', order_sequence: 1 } }),
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[1].procedure_id, checklist_name: 'Antivirus software status', description: 'Verify antivirus is running and updated', order_sequence: 2 } }),
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[1].procedure_id, checklist_name: 'Required software functionality', description: 'Test essential software applications', order_sequence: 3 } }),
    
    // Network & Connectivity Checks
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[2].procedure_id, checklist_name: 'Internet connection speed', description: 'Test internet connectivity and speed', order_sequence: 1 } }),
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[2].procedure_id, checklist_name: 'Local network access', description: 'Verify access to local network resources', order_sequence: 2 } }),
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[2].procedure_id, checklist_name: 'WiFi connectivity', description: 'Check WiFi signal strength and stability', order_sequence: 3 } }),
    
    // Cleanliness & Organization
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[3].procedure_id, checklist_name: 'Workstation surface cleaning', description: 'Clean desk and computer surfaces', order_sequence: 1 } }),
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[3].procedure_id, checklist_name: 'Cable management', description: 'Organize and secure cables properly', order_sequence: 2 } }),
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[3].procedure_id, checklist_name: 'Equipment arrangement', description: 'Ensure equipment is properly arranged', order_sequence: 3 } }),
    
    // User Management
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[4].procedure_id, checklist_name: 'User login functionality', description: 'Test user login and logout processes', order_sequence: 1 } }),
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[4].procedure_id, checklist_name: 'Account access permissions', description: 'Verify user access levels and permissions', order_sequence: 2 } }),
    
    // Security & Safety
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[5].procedure_id, checklist_name: 'Physical security checks', description: 'Check locks and physical security measures', order_sequence: 1 } }),
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[5].procedure_id, checklist_name: 'Data backup verification', description: 'Verify important data is backed up', order_sequence: 2 } }),
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[5].procedure_id, checklist_name: 'Emergency procedures knowledge', description: 'Review emergency response procedures', order_sequence: 3 } }),
    
    // End of Day Checks
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[6].procedure_id, checklist_name: 'Proper shutdown of systems', description: 'Shut down all systems properly', order_sequence: 1 } }),
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[6].procedure_id, checklist_name: 'Equipment power off', description: 'Turn off all equipment and devices', order_sequence: 2 } }),
    prisma.procedure_checklists.create({ data: { procedure_id: procedures[6].procedure_id, checklist_name: 'Area security check', description: 'Ensure area is secure before leaving', order_sequence: 3 } }),
  ]);

  // Create units
  const units = await Promise.all([
    prisma.units.create({ data: { unit_name: 'SSD', device_type_id: deviceTypes[0].device_type_id } }),
    prisma.units.create({ data: { unit_name: 'Hard Disk Drive', device_type_id: deviceTypes[0].device_type_id } }),
    prisma.units.create({ data: { unit_name: 'Mouse', device_type_id: deviceTypes[0].device_type_id } }),
    prisma.units.create({ data: { unit_name: 'Monitor', device_type_id: deviceTypes[0].device_type_id } }),
    prisma.units.create({ data: { unit_name: 'Keyboard', device_type_id: deviceTypes[0].device_type_id } }),
    prisma.units.create({ data: { unit_name: 'AVR', device_type_id: deviceTypes[0].device_type_id } }),
    prisma.units.create({ data: { unit_name: 'PSU', device_type_id: deviceTypes[0].device_type_id } }),
    prisma.units.create({ data: { unit_name: 'RAM', device_type_id: deviceTypes[0].device_type_id } }),
    prisma.units.create({ data: { unit_name: 'CPU', device_type_id: deviceTypes[0].device_type_id } }),
    prisma.units.create({ data: { unit_name: 'Case', device_type_id: deviceTypes[0].device_type_id } }),
    prisma.units.create({ data: { unit_name: 'Router', device_type_id: deviceTypes[1].device_type_id } }),
    prisma.units.create({ data: { unit_name: 'Switch', device_type_id: deviceTypes[1].device_type_id } }),
    prisma.units.create({ data: { unit_name: 'Printer', device_type_id: deviceTypes[2].device_type_id } }),
    prisma.units.create({ data: { unit_name: 'Smart TV', device_type_id: deviceTypes[2].device_type_id } }),
    prisma.units.create({ data: { unit_name: 'Projector', device_type_id: deviceTypes[2].device_type_id } }),
  ]);

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const custodianPassword = await bcrypt.hash('custodian123', 10);

  // Create users
  const users = await Promise.all([
    prisma.users.create({ 
      data: { 
        full_name: 'CIT Administrator', 
        email: 'admin@cit.edu', 
        password_hash: adminPassword,
        role: 'Admin'
      } 
    }),
    prisma.users.create({ 
      data: { 
        full_name: 'Jes Masuangat', 
        email: 'jes@cit.edu', 
        password_hash: custodianPassword,
        role: 'Custodian'
      } 
    }),
    prisma.users.create({ 
      data: { 
        full_name: 'Kyle Rana', 
        email: 'kyle@cit.edu', 
        password_hash: custodianPassword,
        role: 'Custodian'
      } 
    }),
    prisma.users.create({ 
      data: { 
        full_name: 'Jun Brian', 
        email: 'jun@cit.edu', 
        password_hash: adminPassword,
        role: 'Admin'
      } 
    }),
  ]);

  // Create laboratories
  const laboratories = await Promise.all([
    prisma.laboratories.create({ 
      data: { 
        lab_name: 'CIT-Lab 1', 
        location: 'WAC Building 3rd Floor', 
        dept_id: departments[0].dept_id,
        in_charge_id: users[3].user_id // Kyle Rana
      } 
    }),
    prisma.laboratories.create({ 
      data: { 
        lab_name: 'CIT-Lab 2', 
        location: 'WAC Building 3rd Floor', 
        dept_id: departments[0].dept_id,
        in_charge_id: users[1].user_id // Jes Masuangat
      } 
    }),
    prisma.laboratories.create({ 
      data: { 
        lab_name: 'CIT-CISCO Lab', 
        location: 'WAC Building 2nd Floor', 
        dept_id: departments[0].dept_id
      } 
    }),
  ]);

  // Update users with lab assignments
  await Promise.all([
    prisma.users.update({ 
      where: { user_id: users[1].user_id }, 
      data: { lab_id: laboratories[1].lab_id } 
    }),
    prisma.users.update({ 
      where: { user_id: users[3].user_id }, 
      data: { lab_id: laboratories[0].lab_id } 
    }),
  ]);

  // Create workstations
  const workstations = await Promise.all([
    prisma.workstations.create({ 
      data: { 
        workstation_name: 'WS-PC1', 
        lab_id: laboratories[1].lab_id 
      } 
    }),
    prisma.workstations.create({ 
      data: { 
        workstation_name: 'WS-PC2', 
        lab_id: laboratories[1].lab_id 
      } 
    }),
    prisma.workstations.create({ 
      data: { 
        workstation_name: 'WS-PC3', 
        lab_id: laboratories[1].lab_id 
      } 
    }),
  ]);

  // Create inventory assets with details
  const assets = await Promise.all([
    // WS-PC1 assets
    prisma.inventory_assets.create({
      data: {
        lab_id: laboratories[1].lab_id,
        workstation_id: workstations[0].workstation_id,
        unit_id: units[2].unit_id, // Mouse
        added_by_user_id: users[1].user_id,
        details: {
          create: {
            property_tag_no: '123',
            quantity: 1,
            description: 'Mouse Desc',
            serial_number: '123',
            date_of_purchase: new Date('2026-01-21')
          }
        }
      }
    }),
    prisma.inventory_assets.create({
      data: {
        lab_id: laboratories[1].lab_id,
        workstation_id: workstations[0].workstation_id,
        unit_id: units[3].unit_id, // Monitor
        added_by_user_id: users[1].user_id,
        details: {
          create: {
            property_tag_no: '132',
            quantity: 1,
            description: 'Monitor Desc',
            serial_number: '132',
            date_of_purchase: new Date('2026-01-20')
          }
        }
      }
    }),
    // WS-PC2 assets
    prisma.inventory_assets.create({
      data: {
        lab_id: laboratories[1].lab_id,
        workstation_id: workstations[1].workstation_id,
        unit_id: units[9].unit_id, // Case
        added_by_user_id: users[1].user_id,
        details: {
          create: {
            property_tag_no: 'TAG-333',
            quantity: 1,
            description: 'Case ATX',
            serial_number: 'SN-3312',
            date_of_purchase: new Date('2026-01-21')
          }
        }
      }
    }),
    prisma.inventory_assets.create({
      data: {
        lab_id: laboratories[1].lab_id,
        workstation_id: workstations[1].workstation_id,
        unit_id: units[5].unit_id, // AVR
        added_by_user_id: users[1].user_id,
        details: {
          create: {
            property_tag_no: 'TAG-3112',
            quantity: 1,
            description: 'AVR desc',
            serial_number: 'SN-321',
            date_of_purchase: new Date('2026-01-20')
          }
        }
      }
    }),
    prisma.inventory_assets.create({
      data: {
        lab_id: laboratories[1].lab_id,
        workstation_id: workstations[1].workstation_id,
        unit_id: units[1].unit_id, // Hard Disk Drive
        added_by_user_id: users[1].user_id,
        details: {
          create: {
            property_tag_no: 'TAG-331412',
            quantity: 1,
            description: 'HDD Desc',
            serial_number: 'SN-31554'
          }
        }
      }
    }),
    // WS-PC3 assets
    prisma.inventory_assets.create({
      data: {
        lab_id: laboratories[1].lab_id,
        workstation_id: workstations[2].workstation_id,
        unit_id: units[5].unit_id, // AVR
        added_by_user_id: users[1].user_id,
        details: {
          create: {
            property_tag_no: 'TAG-554',
            quantity: 1,
            description: 'Desc',
            serial_number: 'SN-144',
            date_of_purchase: new Date('2025-12-31')
          }
        }
      }
    }),
    prisma.inventory_assets.create({
      data: {
        lab_id: laboratories[1].lab_id,
        workstation_id: workstations[2].workstation_id,
        unit_id: units[7].unit_id, // RAM
        added_by_user_id: users[1].user_id,
        details: {
          create: {
            property_tag_no: 'CIT-1112',
            quantity: 1,
            description: 'Desc RAM',
            serial_number: 'SN-551',
            date_of_purchase: new Date('2026-01-06')
          }
        }
      }
    }),
    // Lab assets (not assigned to workstations)
    prisma.inventory_assets.create({
      data: {
        lab_id: laboratories[1].lab_id,
        unit_id: units[12].unit_id, // Printer
        added_by_user_id: users[1].user_id,
        details: {
          create: {
            property_tag_no: '441234',
            quantity: 1,
            description: 'Brother Printer',
            serial_number: '441234',
            date_of_purchase: new Date('2026-01-21')
          }
        }
      }
    }),
    prisma.inventory_assets.create({
      data: {
        lab_id: laboratories[1].lab_id,
        unit_id: units[10].unit_id, // Router
        added_by_user_id: users[1].user_id,
        details: {
          create: {
            property_tag_no: '441626',
            quantity: 1,
            description: 'Tenda Router',
            serial_number: '113532',
            date_of_purchase: new Date('2026-01-21')
          }
        }
      }
    }),
    prisma.inventory_assets.create({
      data: {
        lab_id: laboratories[1].lab_id,
        unit_id: units[13].unit_id, // Smart TV
        added_by_user_id: users[1].user_id,
        details: {
          create: {
            property_tag_no: '535624',
            quantity: 1,
            description: 'Smart TV desc',
            serial_number: '11123',
            date_of_purchase: new Date('2026-01-20')
          }
        }
      }
    }),
  ]);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
