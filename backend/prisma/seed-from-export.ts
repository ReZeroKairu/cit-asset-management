import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding with exported data...');

  // Clean up existing data
  await prisma.daily_report_checklist_responses.deleteMany();
  await prisma.daily_report_procedures.deleteMany();
  await prisma.report_workstation_items.deleteMany();
  await prisma.procedure_checklists.deleteMany();
  await prisma.procedures.deleteMany();
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
  await prisma.daily_reports.deleteMany();

  console.log('Existing data cleaned up');

  // Import the exported data
  const data = require('../data-export.json');

  // Create campuses
  for (const campus of data.campuses) {
    await prisma.campuses.create({
      data: {
        campus_id: campus.campus_id,
        campus_name: campus.campus_name,
      },
    });
  }
  console.log('Campuses seeded');

  // Create office types
  for (const officeType of data.officeTypes) {
    await prisma.office_types.create({
      data: {
        type_id: officeType.type_id,
        type_name: officeType.type_name,
      },
    });
  }
  console.log('Office types seeded');

  // Create departments
  for (const dept of data.departments) {
    await prisma.departments.create({
      data: {
        dept_id: dept.dept_id,
        dept_name: dept.dept_name,
        campus_id: dept.campus_id,
        office_type_id: dept.office_type_id,
        designee_name: dept.designee_name,
      },
    });
  }
  console.log('Departments seeded');

  // Create device types
  for (const deviceType of data.deviceTypes) {
    await prisma.device_types.create({
      data: {
        device_type_id: deviceType.device_type_id,
        device_type_name: deviceType.device_type_name, // Use correct field name
      },
    });
  }
  console.log('Device types seeded');

  // Create units
  for (const unit of data.units) {
    await prisma.units.create({
      data: {
        unit_id: unit.unit_id,
        unit_name: unit.unit_name,
        device_type_id: unit.device_type_id,
      },
    });
  }
  console.log('Units seeded');

  // Create laboratories
  for (const lab of data.laboratories) {
    await prisma.laboratories.create({
      data: {
        lab_id: lab.lab_id,
        lab_name: lab.lab_name,
        location: lab.location,
        dept_id: lab.dept_id,
        in_charge_id: lab.in_charge_id,
      },
    });
  }
  console.log('Laboratories seeded');

  // Create users with hashed passwords
  for (const user of data.users) {
    const hashedPassword = await bcrypt.hash('123', 10);
    
    await prisma.users.create({
      data: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        password_hash: hashedPassword,
        role: user.role,
        lab_id: user.lab_id,
        created_at: new Date(user.created_at),
      },
    });
  }
  console.log('Users seeded');

  // Create workstations
  for (const workstation of data.workstations) {
    await prisma.workstations.create({
      data: {
        workstation_id: workstation.workstation_id,
        workstation_name: workstation.workstation_name,
        lab_id: workstation.lab_id,
        created_at: new Date(), // Use current date since not in export
      },
    });
  }
  console.log('Workstations seeded');

  // Create inventory assets (basic structure)
  for (const asset of data.inventoryAssets) {
    await prisma.inventory_assets.create({
      data: {
        lab_id: asset.lab_id,
        unit_id: asset.unit_id,
        workstation_id: asset.workstation_id,
        added_by_user_id: asset.added_by_user_id,
        date_added: new Date(), // Use current date
      },
    });
  }
  console.log('Inventory assets seeded');

  // Create procedures
  for (const procedure of data.procedures) {
    await prisma.procedures.create({
      data: {
        procedure_id: procedure.procedure_id,
        procedure_name: procedure.procedure_name,
        description: procedure.description,
        category: procedure.category || 'General', // Fixed field name
      },
    });
  }
  console.log('Procedures seeded');

  // Create procedure checklists
  for (const checklist of data.procedureChecklists) {
    await prisma.procedure_checklists.create({
      data: {
        checklist_id: checklist.checklist_id,
        procedure_id: checklist.procedure_id,
        checklist_name: checklist.checklist_name, // Fixed field name
        description: checklist.description,
        order_sequence: checklist.order_sequence || 0,
        is_required: checklist.is_required !== false,
      },
    });
  }
  console.log('Procedure checklists seeded');

  // Create daily reports
  for (const report of data.dailyReports) {
    await prisma.daily_reports.create({
      data: {
        report_id: report.report_id,
        user_id: report.user_id,
        lab_id: report.lab_id,
        report_date: new Date(report.report_date),
        general_remarks: report.general_remarks,
        status: report.status,
        created_at: new Date(report.created_at),
      },
    });
  }
  console.log('Daily reports seeded');

  console.log('✅ Seeding completed successfully!');
  console.log(`📊 Data exported on: ${data.exportDate}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
