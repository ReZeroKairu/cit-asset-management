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
      // lab_id is removed/null because the labs are not seeded in this script
      lab_id: null,
    },
    create: {
      email: "custodian@cit.edu",
      full_name: "CIT Custodian",
      password_hash: hashedPassword,
      role: "Custodian",
      // lab_id is removed/null because the labs are not seeded in this script
      lab_id: null,
    },
  });

  /* NOTE: Since we updated the schema to include 'asset_statuses' with a default status_id of 1,
     you might want to seed those statuses here eventually so the app works correctly 
     when you start adding assets.
  */

  console.log({
    admin,
    custodian,
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
