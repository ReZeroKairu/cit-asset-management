import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = "custodian123"; // The password you will use to login
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.users.upsert({
    where: { email: "custodian@cit.edu" },
    update: {},
    create: {
      email: "custodian@cit.edu",
      full_name: "CIT Custodian",
      password_hash: hashedPassword,
      role: "Custodian", // change "admin" or "custodian"
    },
  });

  console.log({ admin });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
