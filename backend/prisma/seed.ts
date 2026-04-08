// backend/prisma/seed.ts
import {
  PrismaClient,
  users_role,
  software_installations_status,
  daily_reports_status,
  complaints_status,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Starting database seeding for users...");

  const seedData = {
    users: [
      {
        user_id: 4,
        full_name: "Jesi",
        email: "jesi@cit.edu",
        role: users_role.Admin,
        lab_id: null,
        password_hash: await bcrypt.hash("jesi123", 10),
      },
      {
        user_id: 3,
        full_name: "Jane Custodian",
        email: "custodian2@cit.edu",
        role: users_role.Custodian,
        lab_id: 2,
        password_hash: await bcrypt.hash("password123", 10),
      },
    ],

    assetStatuses: [
      { status_id: 1, status_name: "Functional" },
      { status_id: 2, status_name: "For Disposal" },
      { status_id: 3, status_name: "For Upgrade" },
      { status_id: 4, status_name: "For Replacement" },
      { status_id: 5, status_name: "Disposed" },
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
      {
        lab_id: 3,
        lab_name: "CISCO-Lab 3",
        location: "WAC 2nd Floor",
        dept_id: 1,
        in_charge_id: null,
      },
    ],
    workstations: [
      ...Array.from({ length: 40 }, (_, i) => ({
        workstation_id: i + 1,
        workstation_name: String(i + 1),
        lab_id: 1,
        status_id: 1,
      })),
      {
        workstation_id: 41,
        workstation_name: "Server",
        lab_id: 1,
        status_id: 1,
      },
      ...Array.from({ length: 40 }, (_, i) => ({
        workstation_id: 42 + i,
        workstation_name: String(i + 1),
        lab_id: 2,
        status_id: 1,
      })),
      {
        workstation_id: 82,
        workstation_name: "Server",
        lab_id: 2,
        status_id: 1,
      },
      ...Array.from({ length: 40 }, (_, i) => ({
        workstation_id: 83 + i,
        workstation_name: String(i + 1),
        lab_id: 3,
        status_id: 1,
      })),
      {
        workstation_id: 123,
        workstation_name: "Server",
        lab_id: 3,
        status_id: 1,
      }
    ],
    campuses: [{ campus_id: 1, campus_name: "Main Campus" }],
    officeTypes: [
      { type_id: 1, type_name: "ADMINISTRATIVE" },
      { type_id: 2, type_name: "SUPPORT SERVICE" },
      { type_id: 3, type_name: "ACADEMIC" },
    ],
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
      { device_type_id: 2, device_type_name: "Networking Devices" },
      { device_type_id: 3, device_type_name: "Others" },
    ],
    units: [
      { unit_id: 1, unit_name: "Monitor", device_type_id: 1 },
      { unit_id: 2, unit_name: "USB Ports", device_type_id: 1 },
      { unit_id: 3, unit_name: "Keyboard", device_type_id: 1 },
      { unit_id: 4, unit_name: "Mouse", device_type_id: 1 },
      { unit_id: 5, unit_name: "SSD", device_type_id: 1 },
      { unit_id: 6, unit_name: "PSU", device_type_id: 1 },
      { unit_id: 7, unit_name: "RAM", device_type_id: 1 },
      { unit_id: 8, unit_name: "CPU", device_type_id: 1 },
      { unit_id: 9, unit_name: "HDD", device_type_id: 1 },
      { unit_id: 10, unit_name: "Case", device_type_id: 1 },
      { unit_id: 11, unit_name: "Motherboard", device_type_id: 1 },
      { unit_id: 12, unit_name: "Video Card", device_type_id: 1 },
      { unit_id: 13, unit_name: "Router", device_type_id: 2 },
      { unit_id: 14, unit_name: "Switch", device_type_id: 2 },
      { unit_id: 15, unit_name: "Printer", device_type_id: 3 },
      { unit_id: 16, unit_name: "Air Conditioner", device_type_id: 3 },
      { unit_id: 17, unit_name: "AVR", device_type_id: 1 },
      { unit_id: 18, unit_name: "CCTV Camera", device_type_id: 3 },
    ],
    procedures: [
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

  console.log("📝 Seeding reference data...");

  // Campuses
  for (const item of seedData.campuses) {
    await prisma.campuses.upsert({
      where: { campus_id: item.campus_id },
      update: item,
      create: item,
    });
  }
  // Office Types
  for (const item of seedData.officeTypes) {
    await prisma.office_types.upsert({
      where: { type_id: item.type_id },
      update: item,
      create: item,
    });
  }
  // Departments
  for (const item of seedData.departments) {
    await prisma.departments.upsert({
      where: { dept_id: item.dept_id },
      update: item,
      create: item,
    });
  }

  // Laboratories
  console.log(" Seeding laboratories...");
  for (const item of seedData.laboratories) {
    await prisma.laboratories.upsert({
      where: { lab_id: item.lab_id },
      update: item,
      create: item,
    });
    console.log(` Laboratory: ${item.lab_name}`);
  }

  // Users
  for (const user of seedData.users) {
    await prisma.users.upsert({
      where: { user_id: user.user_id },
      update: user,
      create: user,
    });
    console.log(`👤 User Upserted: ${user.full_name} (${user.email})`);
  }

  // Asset Statuses
  console.log(" Seeding asset statuses...");
  for (const status of seedData.assetStatuses) {
    await prisma.asset_statuses.upsert({
      where: { status_id: status.status_id },
      update: status,
      create: status,
    });
    console.log(` Asset Status: ${status.status_name}`);
  }

  // Device Types
  console.log(" Seeding device types...");
  for (const item of seedData.deviceTypes) {
    await prisma.device_types.upsert({
      where: { device_type_id: item.device_type_id },
      update: item,
      create: item,
    });
  }

  // Units
  console.log(" Seeding units...");
  for (const item of seedData.units) {
    await prisma.units.upsert({
      where: { unit_id: item.unit_id },
      update: item,
      create: item,
    });
    console.log(` Unit: ${item.unit_name}`);
  }

  // Workstations
  console.log(" Seeding workstations...");
  for (const ws of seedData.workstations) {
    await prisma.workstations.upsert({
      where: { workstation_id: ws.workstation_id },
      update: ws,
      create: ws,
    });
  }

  // Procedures
  console.log(" Seeding procedures...");
  for (const procedure of seedData.procedures) {
    await prisma.procedures.upsert({
      where: { procedure_id: procedure.procedure_id },
      update: procedure,
      create: procedure,
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
