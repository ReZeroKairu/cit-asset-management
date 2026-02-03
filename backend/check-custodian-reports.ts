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
  custodians.forEach(custodian => {
    console.log(`- ${custodian.full_name} (${custodian.email}) - Lab ID: ${custodian.lab_id}`);
  });

  // Check archived reports for each custodian
  for (const custodian of custodians) {
    const archivedReports = await prisma.daily_reports.count({
      where: {
        status: 'Approved',
        lab_id: custodian.lab_id
      }
    });

    console.log(`\n📊 ${custodian.full_name}:`);
    console.log(`- Lab ID: ${custodian.lab_id}`);
    console.log(`- Archived Reports: ${archivedReports}`);
    console.log(`- Pages (10 per page): ${Math.ceil(archivedReports / 10)}`);

    if (archivedReports > 0) {
      const sampleReports = await prisma.daily_reports.findMany({
        where: {
          status: 'Approved',
          lab_id: custodian.lab_id
        },
        select: {
          report_id: true,
          report_date: true,
          created_at: true,
          users: { select: { full_name: true } }
        },
        orderBy: { created_at: 'desc' },
        take: 3
      });

      console.log(`- Recent reports:`);
      sampleReports.forEach(report => {
        console.log(`  * Report #${report.report_id} by ${report.users?.full_name} - ${new Date(report.created_at).toLocaleDateString()}`);
      });
    }
  }

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
