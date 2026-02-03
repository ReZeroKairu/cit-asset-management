import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating all user passwords to "123"...');

  // Import the exported data to get user IDs
  const data = require('./data-export.json');

  // Update passwords for all users
  for (const user of data.users) {
    const hashedPassword = await bcrypt.hash('123', 10);
    
    await prisma.users.update({
      where: {
        user_id: user.user_id,
      },
      data: {
        password_hash: hashedPassword,
      },
    });

    console.log(`✅ Updated password for: ${user.full_name} (${user.email})`);
  }

  console.log('✅ All passwords updated successfully!');
  console.log('🔑 New password for all users: "123"');
}

main()
  .catch((e) => {
    console.error('❌ Error during password update:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
