import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking custodian archived reports...');

  // Get custodian users
  const custodians = await prisma.users.findMany({
    where: { role: 'Custodian' },
    select: { user_id: true, full_name: true, email: true, lab_id: true }
  });

  console.log(`\n👥 Found ${custodians.length} custodians:`);
  
  for (const custodian of custodians) {
    console.log(`- ${custodian.full_name} (${custodian.email}) - Lab ID: ${custodian.lab_id}`);
    
    if (custodian.lab_id) {
      const archivedReports = await prisma.daily_reports.count({
        where: {
          status: 'Approved',
          lab_id: custodian.lab_id
        }
      });

      console.log(`  - Archived Reports: ${archivedReports}`);
      console.log(`  - Pages (10 per page): ${Math.ceil(archivedReports / 10)}`);
      console.log(`  - Shows pagination: ${archivedReports > 10 ? 'YES' : 'NO'}`);
    }
  }

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
