//backend/src/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = "custodian123"; // The password you will use to login
  const adminPassword = "admin123"; // Admin password
  const hashedPassword = await bcrypt.hash(password, 10);
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  // Create/Update Admin account
  const admin = await prisma.users.upsert({
    where: { email: "admin@cit.edu" },
    update: {
      role: "Admin",
    },
    create: {
      email: "admin@cit.edu",
      full_name: "CIT Administrator",
      password_hash: hashedAdminPassword,
      role: "Admin",
    },
  });

  // Create/Update Custodian account
  const custodian = await prisma.users.upsert({
    where: { email: "custodian@cit.edu" },
    update: {
      role: "Custodian",
      lab_id: 1, // Assign to Computer Laboratory 1
    },
    create: {
      email: "custodian@cit.edu",
      full_name: "CIT Custodian",
      password_hash: hashedPassword,
      role: "Custodian",
      lab_id: 1, // Assign to Computer Laboratory 1
    },
  });

  // Create campuses
  const campuses = await Promise.all([
    prisma.campuses.upsert({
      where: { campus_id: 1 },
      update: {},
      create: {
        campus_name: "Main Campus",
      },
    }),
    prisma.campuses.upsert({
      where: { campus_id: 2 },
      update: {},
      create: {
        campus_name: "Satellite Campus",
      },
    }),
  ]);

  // Create office types
  const officeTypes = await Promise.all([
    prisma.office_types.upsert({
      where: { type_id: 1 },
      update: {},
      create: {
        type_name: "Academic",
      },
    }),
    prisma.office_types.upsert({
      where: { type_id: 2 },
      update: {},
      create: {
        type_name: "Administrative",
      },
    }),
    prisma.office_types.upsert({
      where: { type_id: 3 },
      update: {},
      create: {
        type_name: "Laboratory",
      },
    }),
    prisma.office_types.upsert({
      where: { type_id: 4 },
      update: {},
      create: {
        type_name: "Support Services",
      },
    }),
  ]);

  // Create departments
  const departments = await Promise.all([
    // College of Information Technology
    prisma.departments.upsert({
      where: { dept_id: 1 },
      update: {},
      create: {
        dept_name: "College of Information Technology",
        campus_id: 1,
        office_type_id: 1,
        designee_name: "Dr. John Doe",
      },
    }),
    // College of Engineering
    prisma.departments.upsert({
      where: { dept_id: 2 },
      update: {},
      create: {
        dept_name: "College of Engineering",
        campus_id: 1,
        office_type_id: 1,
        designee_name: "Dr. Jane Smith",
      },
    }),
    // College of Business Administration
    prisma.departments.upsert({
      where: { dept_id: 3 },
      update: {},
      create: {
        dept_name: "College of Business Administration",
        campus_id: 1,
        office_type_id: 1,
        designee_name: "Dr. Robert Johnson",
      },
    }),
    // College of Arts and Sciences
    prisma.departments.upsert({
      where: { dept_id: 4 },
      update: {},
      create: {
        dept_name: "College of Arts and Sciences",
        campus_id: 1,
        office_type_id: 1,
        designee_name: "Dr. Emily Brown",
      },
    }),
    // College of Education
    prisma.departments.upsert({
      where: { dept_id: 5 },
      update: {},
      create: {
        dept_name: "College of Education",
        campus_id: 1,
        office_type_id: 1,
        designee_name: "Dr. Michael Davis",
      },
    }),
    // College of Nursing
    prisma.departments.upsert({
      where: { dept_id: 6 },
      update: {},
      create: {
        dept_name: "College of Nursing",
        campus_id: 1,
        office_type_id: 1,
        designee_name: "Dr. Sarah Wilson",
      },
    }),
    // Computer Science Department (under Engineering)
    prisma.departments.upsert({
      where: { dept_id: 7 },
      update: {},
      create: {
        dept_name: "Computer Science Department",
        campus_id: 1,
        office_type_id: 1,
        designee_name: "Dr. Alex Thompson",
      },
    }),
    // Information Technology Department (under Engineering)
    prisma.departments.upsert({
      where: { dept_id: 8 },
      update: {},
      create: {
        dept_name: "Information Technology Department",
        campus_id: 1,
        office_type_id: 3,
        designee_name: "Dr. Lisa Anderson",
      },
    }),
    // Mathematics Department
    prisma.departments.upsert({
      where: { dept_id: 9 },
      update: {},
      create: {
        dept_name: "Mathematics Department",
        campus_id: 1,
        office_type_id: 1,
        designee_name: "Dr. David Martinez",
      },
    }),
    // Physics Department
    prisma.departments.upsert({
      where: { dept_id: 10 },
      update: {},
      create: {
        dept_name: "Physics Department",
        campus_id: 1,
        office_type_id: 1,
        designee_name: "Dr. Jennifer Taylor",
      },
    }),
    // Chemistry Department
    prisma.departments.upsert({
      where: { dept_id: 11 },
      update: {},
      create: {
        dept_name: "Chemistry Department",
        campus_id: 1,
        office_type_id: 1,
        designee_name: "Dr. William Brown",
      },
    }),
    // Biology Department
    prisma.departments.upsert({
      where: { dept_id: 12 },
      update: {},
      create: {
        dept_name: "Biology Department",
        campus_id: 1,
        office_type_id: 1,
        designee_name: "Dr. Amanda Garcia",
      },
    }),
    // English Department
    prisma.departments.upsert({
      where: { dept_id: 13 },
      update: {},
      create: {
        dept_name: "English Department",
        campus_id: 1,
        office_type_id: 1,
        designee_name: "Dr. Christopher Lee",
      },
    }),
    // Social Sciences Department
    prisma.departments.upsert({
      where: { dept_id: 14 },
      update: {},
      create: {
        dept_name: "Social Sciences Department",
        campus_id: 1,
        office_type_id: 1,
        designee_name: "Dr. Patricia White",
      },
    }),
    // Humanities Department
    prisma.departments.upsert({
      where: { dept_id: 15 },
      update: {},
      create: {
        dept_name: "Humanities Department",
        campus_id: 1,
        office_type_id: 1,
        designee_name: "Dr. Richard Moore",
      },
    }),
    // Administrative Office
    prisma.departments.upsert({
      where: { dept_id: 16 },
      update: {},
      create: {
        dept_name: "Administrative Office",
        campus_id: 1,
        office_type_id: 2,
        designee_name: "Ms. Barbara Harris",
      },
    }),
    // Library Services
    prisma.departments.upsert({
      where: { dept_id: 17 },
      update: {},
      create: {
        dept_name: "Library Services",
        campus_id: 1,
        office_type_id: 4,
        designee_name: "Ms. Nancy Clark",
      },
    }),
    // Student Affairs
    prisma.departments.upsert({
      where: { dept_id: 18 },
      update: {},
      create: {
        dept_name: "Student Affairs",
        campus_id: 1,
        office_type_id: 2,
        designee_name: "Mr. James Rodriguez",
      },
    }),
    // Finance Office
    prisma.departments.upsert({
      where: { dept_id: 19 },
      update: {},
      create: {
        dept_name: "Finance Office",
        campus_id: 1,
        office_type_id: 2,
        designee_name: "Mr. Daniel Martinez",
      },
    }),
    // Human Resources
    prisma.departments.upsert({
      where: { dept_id: 20 },
      update: {},
      create: {
        dept_name: "Human Resources",
        campus_id: 1,
        office_type_id: 2,
        designee_name: "Ms. Linda Lewis",
      },
    }),
  ]);

  // Create laboratories for the College of Information Technology
  const laboratories = await Promise.all([
    prisma.laboratories.upsert({
      where: { lab_id: 1 },
      update: {},
      create: {
        lab_name: "Computer Laboratory 1",
        location: "Building A, Room 101",
        dept_id: 1,
      },
    }),
    prisma.laboratories.upsert({
      where: { lab_id: 2 },
      update: {},
      create: {
        lab_name: "Computer Laboratory 2",
        location: "Building A, Room 102",
        dept_id: 1,
      },
    }),
    prisma.laboratories.upsert({
      where: { lab_id: 3 },
      update: {},
      create: {
        lab_name: "Networking Laboratory",
        location: "Building A, Room 103",
        dept_id: 8,
      },
    }),
    prisma.laboratories.upsert({
      where: { lab_id: 4 },
      update: {},
      create: {
        lab_name: "Database Laboratory",
        location: "Building A, Room 104",
        dept_id: 1,
      },
    }),
    prisma.laboratories.upsert({
      where: { lab_id: 5 },
      update: {},
      create: {
        lab_name: "Software Development Lab",
        location: "Building A, Room 105",
        dept_id: 1,
      },
    }),
    prisma.laboratories.upsert({
      where: { lab_id: 6 },
      update: {},
      create: {
        lab_name: "IT Support Center",
        location: "Building B, Room 201",
        dept_id: 8,
      },
    }),
  ]);

  // Create workstations (after laboratories are created)
  const workstations = await Promise.all([
    prisma.workstations.upsert({
      where: { workstation_id: 1 },
      update: {},
      create: {
        workstation_name: "WS-PC001",
        lab_id: 1,
      },
    }),
    prisma.workstations.upsert({
      where: { workstation_id: 2 },
      update: {},
      create: {
        workstation_name: "WS-PC002",
        lab_id: 1,
      },
    }),
    prisma.workstations.upsert({
      where: { workstation_id: 3 },
      update: {},
      create: {
        workstation_name: "WS-NET001",
        lab_id: 3,
      },
    }),
  ]);

  // Create device types and units for inventory
  const deviceTypes = await Promise.all([
    prisma.device_types.upsert({
      where: { device_type_id: 1 },
      update: {},
      create: {
        device_type_name: "Computer",
      },
    }),
    prisma.device_types.upsert({
      where: { device_type_id: 2 },
      update: {},
      create: {
        device_type_name: "Monitor",
      },
    }),
    prisma.device_types.upsert({
      where: { device_type_id: 3 },
      update: {},
      create: {
        device_type_name: "Printer",
      },
    }),
    prisma.device_types.upsert({
      where: { device_type_id: 4 },
      update: {},
      create: {
        device_type_name: "Keyboard",
      },
    }),
    prisma.device_types.upsert({
      where: { device_type_id: 5 },
      update: {},
      create: {
        device_type_name: "Mouse",
      },
    }),
  ]);

  const units = await Promise.all([
    prisma.units.upsert({
      where: { unit_id: 1 },
      update: {},
      create: {
        unit_name: "System Unit",
        device_type_id: 1,
      },
    }),
    prisma.units.upsert({
      where: { unit_id: 2 },
      update: {},
      create: {
        unit_name: "Desktop Computer",
        device_type_id: 1,
      },
    }),
    prisma.units.upsert({
      where: { unit_id: 3 },
      update: {},
      create: {
        unit_name: "Laptop",
        device_type_id: 1,
      },
    }),
    prisma.units.upsert({
      where: { unit_id: 4 },
      update: {},
      create: {
        unit_name: "LED Monitor",
        device_type_id: 2,
      },
    }),
    prisma.units.upsert({
      where: { unit_id: 5 },
      update: {},
      create: {
        unit_name: "Laser Printer",
        device_type_id: 3,
      },
    }),
    prisma.units.upsert({
      where: { unit_id: 6 },
      update: {},
      create: {
        unit_name: "Inkjet Printer",
        device_type_id: 3,
      },
    }),
    prisma.units.upsert({
      where: { unit_id: 7 },
      update: {},
      create: {
        unit_name: "Gaming Keyboard",
        device_type_id: 4,
      },
    }),
    prisma.units.upsert({
      where: { unit_id: 8 },
      update: {},
      create: {
        unit_name: "Standard Keyboard",
        device_type_id: 4,
      },
    }),
    prisma.units.upsert({
      where: { unit_id: 9 },
      update: {},
      create: {
        unit_name: "Optical Mouse",
        device_type_id: 5,
      },
    }),
    prisma.units.upsert({
      where: { unit_id: 10 },
      update: {},
      create: {
        unit_name: "Wireless Mouse",
        device_type_id: 5,
      },
    }),
  ]);

  // Create standard tasks for daily reports
  const standardTasks = await Promise.all([
    prisma.standard_tasks.upsert({
      where: { task_id: 1 },
      update: {},
      create: {
        task_name: "Check and clean computer equipment",
        category: "Equipment Maintenance",
      },
    }),
    prisma.standard_tasks.upsert({
      where: { task_id: 2 },
      update: {},
      create: {
        task_name: "Verify internet connectivity",
        category: "Network",
      },
    }),
    prisma.standard_tasks.upsert({
      where: { task_id: 3 },
      update: {},
      create: {
        task_name: "Organize workstation area",
        category: "Housekeeping",
      },
    }),
    prisma.standard_tasks.upsert({
      where: { task_id: 4 },
      update: {},
      create: {
        task_name: "Check printer and supplies",
        category: "Equipment Maintenance",
      },
    }),
    prisma.standard_tasks.upsert({
      where: { task_id: 5 },
      update: {},
      create: {
        task_name: "Update software if needed",
        category: "Software",
      },
    }),
    prisma.standard_tasks.upsert({
      where: { task_id: 6 },
      update: {},
      create: {
        task_name: "Monitor server performance",
        category: "System Administration",
      },
    }),
    prisma.standard_tasks.upsert({
      where: { task_id: 7 },
      update: {},
      create: {
        task_name: "Backup important data",
        category: "Data Management",
      },
    }),
    prisma.standard_tasks.upsert({
      where: { task_id: 8 },
      update: {},
      create: {
        task_name: "Check security systems",
        category: "Security",
      },
    }),
  ]);

  console.log({
    admin,
    custodian,
    campuses,
    officeTypes,
    departments,
    laboratories,
    deviceTypes,
    units,
    workstations,
    standardTasks,
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
