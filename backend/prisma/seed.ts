import { PrismaClient, users_role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting database seeding with backup data...');

  // Current database backup data
  const backupData = {
    users: [
      {
        user_id: 1,
        full_name: "System Administrator",
        email: "admin@cit.edu",
        role: users_role.Admin,
        lab_id: null,
        password_hash: await bcrypt.hash('admin123', 10)
      },
      {
        user_id: 2,
        full_name: "John Custodian",
        email: "custodian1@cit.edu",
        role: users_role.Custodian,
        lab_id: 1,
        password_hash: await bcrypt.hash('custodian123', 10)
      },
      {
        user_id: 3,
        full_name: "Jane Custodian",
        email: "custodian2@cit.edu",
        role: users_role.Custodian,
        lab_id: 3,
        password_hash: await bcrypt.hash('custodian123', 10)
      },
      {
        user_id: 4,
        full_name: "Someone",
        email: "new@cit.edu",
        role: users_role.Custodian,
        lab_id: 2,
        password_hash: await bcrypt.hash('custodian123', 10)
      }
    ],
    laboratories: [
      {
        lab_id: 1,
        lab_name: "CIT-Lab 1",
        location: "WAC Building 3rd Floor",
        dept_id: 1,
        in_charge_id: null
      },
      {
        lab_id: 2,
        lab_name: "CIT-Lab 2",
        location: "WAC Building 3rd Floor",
        dept_id: 1,
        in_charge_id: 4
      },
      {
        lab_id: 3,
        lab_name: "CIT-CISCO Lab",
        location: "WAC Building 2nd Floor",
        dept_id: 1,
        in_charge_id: null
      }
    ],
    workstations: [
      {
        workstation_id: 1,
        workstation_name: "WS-01",
        lab_id: 3,
        workstation_remarks: null,
        status_id: 1
      },
      {
        workstation_id: 2,
        workstation_name: "WS-02",
        lab_id: 3,
        workstation_remarks: null,
        status_id: 1
      },
      {
        workstation_id: 3,
        workstation_name: "WS-03",
        lab_id: 3,
        workstation_remarks: null,
        status_id: 1
      }
    ],
    inventoryAssets: [
      {
        asset_id: 1,
        lab_id: 3,
        workstation_id: 1,
        unit_id: 13,
        added_by_user_id: 2
      },
      {
        asset_id: 2,
        lab_id: 3,
        workstation_id: 2,
        unit_id: 9,
        added_by_user_id: 2
      },
      {
        asset_id: 3,
        lab_id: 3,
        workstation_id: 3,
        unit_id: 6,
        added_by_user_id: 2
      }
    ],
    assetDetails: [
      {
        detail_id: 1,
        asset_id: 1,
        property_tag_no: "2342",
        quantity: 1,
        description: "soe",
        serial_number: "342",
        date_of_purchase: null,
        asset_remarks: "good",
        status_id: 1
      },
      {
        detail_id: 2,
        asset_id: 2,
        property_tag_no: "234",
        quantity: 1,
        description: "so",
        serial_number: "243",
        date_of_purchase: null,
        asset_remarks: null,
        status_id: 1
      },
      {
        detail_id: 3,
        asset_id: 3,
        property_tag_no: null,
        quantity: 1,
        description: "",
        serial_number: "342",
        date_of_purchase: new Date("2026-02-03"),
        asset_remarks: null,
        status_id: 1
      }
    ],
    procedures: [
      {
        procedure_id: 1,
        procedure_name: "Software Checks",
        category: "Software",
        is_active: true
      },
      {
        procedure_id: 2,
        procedure_name: "Network & Connectivity Checks",
        category: "Network",
        is_active: true
      },
      {
        procedure_id: 3,
        procedure_name: "Cleanliness & Organization",
        category: "Maintenance",
        is_active: true
      },
      {
        procedure_id: 4,
        procedure_name: "Hardware Checks",
        category: "Hardware",
        is_active: true
      },
      {
        procedure_id: 5,
        procedure_name: "End of Day Checks",
        category: "Procedures",
        is_active: true
      },
      {
        procedure_id: 6,
        procedure_name: "Security & Safety",
        category: "Security",
        is_active: true
      },
      {
        procedure_id: 7,
        procedure_name: "User Management",
        category: "Administration",
        is_active: true
      }
    ],
    assetStatuses: [
      {
        status_id: 1,
        status_name: "Functional"
      },
      {
        status_id: 2,
        status_name: "For Repair"
      },
      {
        status_id: 3,
        status_name: "For Replacement"
      },
      {
        status_id: 4,
        status_name: "Lost"
      }
    ],
    departments: [
      {
        dept_id: 1,
        dept_name: "College of Information Technology",
        campus_id: 1,
        office_type_id: 3,
        designee_name: "Dean IT"
      },
      {
        dept_id: 2,
        dept_name: "Senior High School",
        campus_id: 1,
        office_type_id: 3,
        designee_name: "SHS Principal"
      },
      {
        dept_id: 3,
        dept_name: "College of Pharmacy",
        campus_id: 3,
        office_type_id: 3,
        designee_name: "Dean Pharmacy"
      },
      {
        dept_id: 4,
        dept_name: "Junior High School",
        campus_id: 2,
        office_type_id: 3,
        designee_name: "JHS Principal"
      }
    ],
    campuses: [
      {
        campus_id: 1,
        campus_name: "Main Campus"
      },
      {
        campus_id: 2,
        campus_name: "RNP Campus"
      },
      {
        campus_id: 3,
        campus_name: "Paseo Campus"
      }
    ],
    officeTypes: [
      {
        type_id: 1,
        type_name: "ADMINISTRATIVE"
      },
      {
        type_id: 2,
        type_name: "SUPPORT SERVICE"
      },
      {
        type_id: 3,
        type_name: "ACADEMIC"
      }
    ],
    units: [
      { unit_id: 1, unit_name: "Monitor", device_type_id: 2 },
      { unit_id: 2, unit_name: "SSD", device_type_id: 2 },
      { unit_id: 3, unit_name: "PSU", device_type_id: 2 },
      { unit_id: 4, unit_name: "RAM", device_type_id: 2 },
      { unit_id: 5, unit_name: "Printer", device_type_id: 1 },
      { unit_id: 6, unit_name: "Keyboard", device_type_id: 2 },
      { unit_id: 7, unit_name: "Router", device_type_id: 3 },
      { unit_id: 8, unit_name: "Projector", device_type_id: 1 },
      { unit_id: 9, unit_name: "Switch", device_type_id: 3 },
      { unit_id: 10, unit_name: "CPU", device_type_id: 2 },
      { unit_id: 11, unit_name: "Smart TV", device_type_id: 1 },
      { unit_id: 12, unit_name: "Hard Disk Drive", device_type_id: 2 },
      { unit_id: 13, unit_name: "Case", device_type_id: 2 },
      { unit_id: 14, unit_name: "Mouse", device_type_id: 2 },
      { unit_id: 15, unit_name: "AVR", device_type_id: 2 }
    ],
    deviceTypes: [
      {
        device_type_id: 1,
        device_type_name: "Other Devices"
      },
      {
        device_type_id: 2,
        device_type_name: "PC Devices"
      },
      {
        device_type_id: 3,
        device_type_name: "Network Devices"
      }
    ]
  };

  // Seed data in order to respect foreign key constraints
  console.log('📝 Seeding reference data...');

  // 1. Campuses
  for (const campus of backupData.campuses) {
    await prisma.campuses.upsert({
      where: { campus_id: campus.campus_id },
      update: campus,
      create: campus,
    });
    console.log(`✅ Campus: ${campus.campus_name}`);
  }

  // 2. Office Types
  for (const officeType of backupData.officeTypes) {
    await prisma.office_types.upsert({
      where: { type_id: officeType.type_id },
      update: officeType,
      create: officeType,
    });
    console.log(`✅ Office Type: ${officeType.type_name}`);
  }

  // 3. Departments
  for (const dept of backupData.departments) {
    await prisma.departments.upsert({
      where: { dept_id: dept.dept_id },
      update: dept,
      create: dept,
    });
    console.log(`✅ Department: ${dept.dept_name}`);
  }

  // 4. Device Types
  for (const deviceType of backupData.deviceTypes) {
    await prisma.device_types.upsert({
      where: { device_type_id: deviceType.device_type_id },
      update: deviceType,
      create: deviceType,
    });
    console.log(`✅ Device Type: ${deviceType.device_type_name}`);
  }

  // 5. Units
  for (const unit of backupData.units) {
    await prisma.units.upsert({
      where: { unit_id: unit.unit_id },
      update: unit,
      create: unit,
    });
    console.log(`✅ Unit: ${unit.unit_name}`);
  }

  // 6. Asset Statuses
  for (const status of backupData.assetStatuses) {
    await prisma.asset_statuses.upsert({
      where: { status_id: status.status_id },
      update: status,
      create: status,
    });
    console.log(`✅ Asset Status: ${status.status_name}`);
  }

  // 7. Users
  for (const user of backupData.users) {
    await prisma.users.upsert({
      where: { email: user.email },
      update: user,
      create: user,
    });
    console.log(`✅ User: ${user.full_name} (${user.email})`);
  }

  // 8. Laboratories
  for (const lab of backupData.laboratories) {
    await prisma.laboratories.upsert({
      where: { lab_id: lab.lab_id },
      update: lab,
      create: lab,
    });
    console.log(`✅ Laboratory: ${lab.lab_name}`);
  }

  // 9. Workstations
  for (const ws of backupData.workstations) {
    await prisma.workstations.upsert({
      where: { workstation_id: ws.workstation_id },
      update: ws,
      create: ws,
    });
    console.log(`✅ Workstation: ${ws.workstation_name}`);
  }

  // 10. Procedures
  for (const proc of backupData.procedures) {
    await prisma.procedures.upsert({
      where: { procedure_id: proc.procedure_id },
      update: proc,
      create: proc,
    });
    console.log(`✅ Procedure: ${proc.procedure_name}`);
  }

  // 11. Inventory Assets
  for (const asset of backupData.inventoryAssets) {
    await prisma.inventory_assets.upsert({
      where: { asset_id: asset.asset_id },
      update: asset,
      create: asset,
    });
    console.log(`✅ Inventory Asset: ${asset.asset_id}`);
  }

  // 12. Asset Details
  for (const detail of backupData.assetDetails) {
    await prisma.asset_details.upsert({
      where: { detail_id: detail.detail_id },
      update: detail,
      create: detail,
    });
    console.log(`✅ Asset Detail: ${detail.property_tag_no || 'No Tag'}`);
  }

  console.log('🎉 Database seeding completed successfully!');
  console.log('📊 Summary:');
  console.log(`   - Users: ${backupData.users.length}`);
  console.log(`   - Laboratories: ${backupData.laboratories.length}`);
  console.log(`   - Workstations: ${backupData.workstations.length}`);
  console.log(`   - Inventory Assets: ${backupData.inventoryAssets.length}`);
  console.log(`   - Procedures: ${backupData.procedures.length}`);
  console.log(`   - Asset Details: ${backupData.assetDetails.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
