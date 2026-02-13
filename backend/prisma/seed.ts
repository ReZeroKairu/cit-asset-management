// backend/prisma/seed.ts
import { PrismaClient, users_role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Starting database seeding...");

  const seedData = {
    // 1. USERS: Only 1 Admin and 1 Custodian
    users: [
      {
        user_id: 1,
        full_name: "System Administrator",
        email: "admin@cit.edu",
        role: users_role.Admin,
        lab_id: null,
        password_hash: await bcrypt.hash("admin123", 10),
      },
      {
        user_id: 2,
        full_name: "John Custodian",
        email: "custodian@cit.edu",
        role: users_role.Custodian,
        lab_id: 1, // We will handle this carefully
        password_hash: await bcrypt.hash("password123", 10),
      },
    ],

    assetStatuses: [
      { status_id: 1, status_name: "Functional" },
      { status_id: 2, status_name: "For Repair" },
      { status_id: 3, status_name: "For Upgrade" },
      { status_id: 4, status_name: "For Replacement" },
    ],

    laboratories: [
      {
        lab_id: 1,
        lab_name: "CIT-Lab 1",
        location: "WAC 3rd Floor",
        dept_id: 1,
        in_charge_id: 2,
      },
      {
        lab_id: 2,
        lab_name: "CIT-Lab 2",
        location: "WAC 3rd Floor",
        dept_id: 1,
        in_charge_id: null,
      },
    ],
    workstations: [
      { workstation_id: 1, workstation_name: "WS-01", lab_id: 1, status_id: 1 },
      { workstation_id: 2, workstation_name: "WS-02", lab_id: 1, status_id: 1 },
    ],
    campuses: [{ campus_id: 1, campus_name: "Main Campus" }],
    officeTypes: [{ type_id: 3, type_name: "ACADEMIC" }],
    departments: [
      {
        dept_id: 1,
        dept_name: "College of IT",
        campus_id: 1,
        office_type_id: 3,
        designee_name: "Dean",
      },
    ],
    deviceTypes: [
      { device_type_id: 1, device_type_name: "PC Devices" },
      { device_type_id: 2, device_type_name: "Peripherals" },
    ],
    units: [
      { unit_id: 1, unit_name: "Monitor", device_type_id: 1 },
      { unit_id: 2, unit_name: "System Unit", device_type_id: 1 },
      { unit_id: 3, unit_name: "Keyboard", device_type_id: 2 },
      { unit_id: 4, unit_name: "Mouse", device_type_id: 2 },
    ],
    procedures: [
      // ✅ DAR (Daily Activity Report) Procedures
      {
        procedure_id: 1,
        procedure_name: "User Management",
        category: "DAR",
        is_active: true,
      },
      {
        procedure_id: 2,
        procedure_name: "Software Checks",
        category: "DAR",
        is_active: true,
      },
      {
        procedure_id: 3,
        procedure_name: "Security & Safety",
        category: "DAR",
        is_active: true,
      },
      {
        procedure_id: 4,
        procedure_name: "Network & Connectivity",
        category: "DAR",
        is_active: true,
      },
      {
        procedure_id: 5,
        procedure_name: "Hardware Checks",
        category: "DAR",
        is_active: true,
      },
      {
        procedure_id: 6,
        procedure_name: "Cleanliness & Organization",
        category: "DAR",
        is_active: true,
      },
      {
        procedure_id: 7,
        procedure_name: "End of the day checks",
        category: "DAR",
        is_active: true,
      },

      // ✅ QPMC (Quarterly Preventive Maintenance Check) Procedures
      {
        procedure_id: 8,
        procedure_name: "Hardware Maintenance",
        category: "QPMC",
        is_active: true,
      },
      {
        procedure_id: 9,
        procedure_name: "Software Maintenance",
        category: "QPMC",
        is_active: true,
      },
      {
        procedure_id: 10,
        procedure_name: "Security Maintenance",
        category: "QPMC",
        is_active: true,
      },
      {
        procedure_id: 11,
        procedure_name: "Network Maintenance",
        category: "QPMC",
        is_active: true,
      },
      {
        procedure_id: 12,
        procedure_name: "System Performance",
        category: "QPMC",
        is_active: true,
      },
      {
        procedure_id: 13,
        procedure_name: "Regular Cleaning",
        category: "QPMC",
        is_active: true,
      },
    ],
  };

  // --- EXECUTION ---

  // 1. Campuses
  for (const item of seedData.campuses) {
    await prisma.campuses.upsert({
      where: { campus_id: item.campus_id },
      update: item,
      create: item,
    });
  }
  // 2. Office Types
  for (const item of seedData.officeTypes) {
    await prisma.office_types.upsert({
      where: { type_id: item.type_id },
      update: item,
      create: item,
    });
  }
  // 3. Departments
  for (const item of seedData.departments) {
    await prisma.departments.upsert({
      where: { dept_id: item.dept_id },
      update: item,
      create: item,
    });
  }

  // ✅ 4. Users (Phase 1: Create without Lab Assignment)
  // We strip the lab_id here to prevent the "Foreign Key Constraint" error
  for (const user of seedData.users) {
    const { lab_id, ...userData } = user; // Separate lab_id from the rest
    await prisma.users.upsert({
      where: { user_id: user.user_id },
      update: userData, // Update without lab_id
      create: { ...userData, lab_id: null }, // Create with lab_id as null
    });
    console.log(`👤 User Created (Pending Lab): ${user.full_name}`);
  }

  // 5. Laboratories (Now safe to create, as users exist for in_charge_id)
  for (const lab of seedData.laboratories) {
    await prisma.laboratories.upsert({
      where: { lab_id: lab.lab_id },
      update: lab,
      create: lab,
    });
  }

  // ✅ 6. Users (Phase 2: Assign Labs)
  // Now that labs exist, we can link the users to them
  for (const user of seedData.users) {
    if (user.lab_id) {
      await prisma.users.update({
        where: { user_id: user.user_id },
        data: { lab_id: user.lab_id },
      });
      console.log(
        `🔗 User Assigned to Lab: ${user.full_name} -> Lab ${user.lab_id}`,
      );
    }
  }

  // 7. Asset Statuses
  for (const status of seedData.assetStatuses) {
    await prisma.asset_statuses.upsert({
      where: { status_id: status.status_id },
      update: status,
      create: status,
    });
  }
  // 8. Device Types & Units
  for (const dt of seedData.deviceTypes) {
    await prisma.device_types.upsert({
      where: { device_type_id: dt.device_type_id },
      update: dt,
      create: dt,
    });
  }
  for (const unit of seedData.units) {
    await prisma.units.upsert({
      where: { unit_id: unit.unit_id },
      update: unit,
      create: unit,
    });
  }
  // 9. Workstations
  for (const ws of seedData.workstations) {
    await prisma.workstations.upsert({
      where: { workstation_id: ws.workstation_id },
      update: ws,
      create: ws,
    });
  }
  // 10. Procedures
  for (const proc of seedData.procedures) {
    await prisma.procedures.upsert({
      where: { procedure_id: proc.procedure_id },
      update: proc,
      create: proc,
    });
  }

  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
