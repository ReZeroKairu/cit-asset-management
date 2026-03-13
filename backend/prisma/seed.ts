// backend/prisma/seed.ts
import { PrismaClient, users_role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Starting database seeding for users...");

  const seedData = {
    // 1. USERS: Only 1 Admin and 2 Custodians
    users: [
      {
        user_id: 4,
        full_name: "Jesi",
        email: "jesi@cit.edu",
        role: users_role.Admin,
        lab_id: null,
        password_hash: await bcrypt.hash("jesi123", 10),
      },
      
    ],
  };

  console.log("📝 Seeding users data...");

  for (const user of seedData.users) {
    await prisma.users.upsert({
      where: { user_id: user.user_id }, 
      update: user,
      create: user,
    });
    console.log(`👤 User Upserted: ${user.full_name} (${user.email})`);
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