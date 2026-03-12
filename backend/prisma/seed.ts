// backend/prisma/seed.ts
import { PrismaClient, users_role, lab_requests_status, equipment_borrows_status, software_installations_status, daily_reports_status, complaints_status } from "@prisma/client";
import * as bcrypt from "bcryptjs";

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
      {
        user_id: 3,
        full_name: "Jane Custodian",
        email: "custodian2@cit.edu",
        role: users_role.Custodian,
        lab_id: 2, // We will handle this carefully
        password_hash: await bcrypt.hash("password123", 10),
      },
    ],

    assetStatuses: [
      { status_id: 1, status_name: "Functional" },
      { status_id: 2, status_name: "For Repair" },
      { status_id: 3, status_name: "For Upgrade" },
      { status_id: 4, status_name: "For Replacement" },
      { status_id: 5, status_name: "Lost" },
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
      { unit_id: 2, unit_name: "System Unit", device_type_id: 1 },
      { unit_id: 3, unit_name: "Keyboard", device_type_id: 1 },
      { unit_id: 4, unit_name: "Mouse", device_type_id: 1 },
      { unit_id: 5, unit_name: "SSD", device_type_id: 1 },
      { unit_id: 6, unit_name: "PSU", device_type_id: 1 },
      { unit_id: 7, unit_name: "RAM", device_type_id: 1 },
      { unit_id: 8, unit_name: "CPU", device_type_id: 1 },
      { unit_id: 9, unit_name: "HDD", device_type_id: 1 },
      { unit_id: 10, unit_name: "Case", device_type_id: 1 },
      { unit_id: 11, unit_name: "CPU Fan", device_type_id: 1 },
      { unit_id: 12, unit_name: "Motherboard", device_type_id: 1 },
      { unit_id: 13, unit_name: "System Fan", device_type_id: 1 },
      { unit_id: 14, unit_name: "GPU", device_type_id: 1 },
      { unit_id: 15, unit_name: "Video Card", device_type_id: 1 },
      { unit_id: 16, unit_name: "Router", device_type_id: 2 },
      { unit_id: 17, unit_name: "Switch", device_type_id: 2 },
      { unit_id: 18, unit_name: "Printer", device_type_id: 3 },
      { unit_id: 19, unit_name: "Air Conditioner", device_type_id: 3 },
      { unit_id: 20, unit_name: "AVR", device_type_id: 1 },
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

    // Example Data for Tables
    

    inventoryAssets: [
      {
        asset_id: 1,
        lab_id: 1,
        workstation_id: 1,
        unit_id: 2,
        added_by_user_id: 2,
        date_added: new Date("2024-01-10"),
      },
      {
        asset_id: 2,
        lab_id: 1,
        workstation_id: 2,
        unit_id: 1,
        added_by_user_id: 2,
        date_added: new Date("2024-01-10"),
      },
    ],

    assetDetails: [
      {
        detail_id: 1,
        asset_id: 1,
        property_tag_no: "CIT-PC-001",
        quantity: 1,
        description: "Dell OptiPlex 7090 System Unit",
        serial_number: "DL70902024001",
        date_of_purchase: new Date("2024-01-05"),
        asset_remarks: "Core i5, 8GB RAM, 256GB SSD",
        status_id: 1,
      },
      {
        detail_id: 2,
        asset_id: 2,
        property_tag_no: "CIT-MON-001",
        quantity: 1,
        description: "Dell 24-inch LED Monitor",
        serial_number: "DLM2402024001",
        date_of_purchase: new Date("2024-01-05"),
        asset_remarks: "1920x1080 resolution, HDMI/VGA",
        status_id: 1,
      },
    ],

    dailyReports: [
      {
        report_id: 1,
        user_id: 2,
        lab_id: 1,
        report_date: new Date("2024-01-15"),
        general_remarks: "All systems functional, 15 students served",
        status: daily_reports_status.Approved,
      },
      {
        report_id: 2,
        user_id: 3,
        lab_id: 2,
        report_date: new Date("2024-01-16"),
        general_remarks: "Minor network issue resolved, 8 students served",
        status: daily_reports_status.Pending,
      },
    ],

    complaints: [
      {
        complaint_id: 1,
        lab_id: 1,
        workstation_id: 1,
        faculty_student_name: "Juan Dela Cruz",
        user_type: "Student",
        year_level: "3rd Year",
        issue_description: "Mouse not working properly",
        status: complaints_status.Resolved,
        monitored_by: "John Custodian",
        approved_by: "Admin",
        custodian_user_id: 2,
        remarks: "Replaced with new mouse",
        resolved_at: new Date("2024-01-15"),
        created_at: new Date("2024-01-15"),
        updated_at: new Date("2024-01-15"),
        accepted_at: new Date("2024-01-15"),
      },
      {
        complaint_id: 2,
        lab_id: 2,
        workstation_id: 2,
        faculty_student_name: "Maria Santos",
        user_type: "Faculty",
        year_level: null,
        issue_description: "Application crashes frequently",
        status: complaints_status.Open,
        monitored_by: "Jane Custodian",
        approved_by: null,
        custodian_user_id: 3,
        remarks: "Investigating software compatibility",
        resolved_at: null,
        created_at: new Date("2024-01-16"),
        updated_at: new Date("2024-01-16"),
        accepted_at: null,
      },
    ],
  };

  // Seed data in order to respect foreign key constraints
  console.log("📝 Seeding reference data...");

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

  // 5. Device Types
  for (const item of seedData.deviceTypes) {
    await prisma.device_types.upsert({
      where: { device_type_id: item.device_type_id },
      update: item,
      create: item,
    });
  }

  // 6. Units
  for (const unit of seedData.units) {
    await prisma.units.upsert({
      where: { unit_id: unit.unit_id },
      update: unit,
      create: unit,
    });
    console.log(`✅ Unit: ${unit.unit_name}`);
  }

  // 7. Asset Statuses
  for (const status of seedData.assetStatuses) {
    await prisma.asset_statuses.upsert({
      where: { status_id: status.status_id },
      update: status,
      create: status,
    });
    console.log(`✅ Asset Status: ${status.status_name}`);
  }

  // 8. Laboratories (must be seeded before users that reference them)
  for (const lab of seedData.laboratories) {
    await prisma.laboratories.upsert({
      where: { lab_id: lab.lab_id },
      update: { ...lab, in_charge_id: null }, // Remove in_charge_id temporarily
      create: { ...lab, in_charge_id: null },
    });
    console.log(` Laboratory: ${lab.lab_name}`);
  }

  // 9. Users (now that labs exist)
  for (const user of seedData.users) {
    await prisma.users.upsert({
      where: { email: user.email },
      update: user,
      create: user,
    });
    console.log(` User: ${user.full_name} (${user.email})`);
  }

  // 10. Workstations
  console.log(" Seeding workstations...");
  for (const ws of seedData.workstations) {
    await prisma.workstations.upsert({
      where: { workstation_id: ws.workstation_id },
      update: ws,
      create: ws,
    });
  }

  // 11. Procedures
  console.log(" Seeding procedures...");
  for (const proc of seedData.procedures) {
    await prisma.procedures.upsert({
      where: { procedure_id: proc.procedure_id },
      update: proc,
      create: proc,
    });
    console.log(` Procedure: ${proc.procedure_name}`);
  }

  // 15. Inventory Assets
  console.log(" Seeding inventory assets...");
  for (const asset of seedData.inventoryAssets) {
    await prisma.inventory_assets.upsert({
      where: { asset_id: asset.asset_id },
      update: asset,
      create: asset,
    });
    console.log(` Inventory Asset: ${asset.asset_id}`);
  }

  // 16. Asset Details
  console.log(" Seeding asset details...");
  for (const detail of seedData.assetDetails) {
    await prisma.asset_details.upsert({
      where: { detail_id: detail.detail_id },
      update: detail,
      create: detail,
    });
    console.log(` Asset Detail: ${detail.property_tag_no}`);
  }

  // 17. Daily Reports
  console.log(" Seeding daily reports...");
  for (const report of seedData.dailyReports) {
    await prisma.daily_reports.upsert({
      where: { report_id: report.report_id },
      update: report,
      create: report,
    });
    console.log(` Daily Report: ${report.report_date.toISOString().split('T')[0]}`);
  }

  // 18. Complaints
  console.log(" Seeding complaints...");
  for (const complaint of seedData.complaints) {
    await prisma.complaints.upsert({
      where: { complaint_id: complaint.complaint_id },
      update: complaint,
      create: complaint,
    });
    console.log(` Complaint: ${complaint.issue_description}`);
  }

  // 19. Inventory Assets - Skip for now due to workstation dependency
  console.log("⏭️ Skipping inventory assets seeding for now...");

  // 12. Asset Details - Skip for now due to dependency issues
  console.log("⏭️ Skipping asset details seeding for now...");

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
