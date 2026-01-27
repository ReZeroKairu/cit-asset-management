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
      role: "Admin"
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
      role: "Custodian"
    },
    create: {
      email: "custodian@cit.edu",
      full_name: "CIT Custodian",
      password_hash: hashedPassword,
      role: "Custodian",
    },
  });

  // Create standard tasks for daily reports
  const standardTasks = await Promise.all([
    prisma.standard_tasks.upsert({
      where: { task_id: 1 },
      update: {},
      create: {
        task_name: "Check and clean computer equipment",
        category: "Equipment Maintenance"
      }
    }),
    prisma.standard_tasks.upsert({
      where: { task_id: 2 },
      update: {},
      create: {
        task_name: "Verify internet connectivity",
        category: "Network"
      }
    }),
    prisma.standard_tasks.upsert({
      where: { task_id: 3 },
      update: {},
      create: {
        task_name: "Organize workstation area",
        category: "Housekeeping"
      }
    }),
    prisma.standard_tasks.upsert({
      where: { task_id: 4 },
      update: {},
      create: {
        task_name: "Check printer and supplies",
        category: "Equipment Maintenance"
      }
    }),
    prisma.standard_tasks.upsert({
      where: { task_id: 5 },
      update: {},
      create: {
        task_name: "Update software if needed",
        category: "Software"
      }
    })
  ]);

  console.log({ admin, custodian, standardTasks });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
