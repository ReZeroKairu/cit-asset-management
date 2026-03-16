const { PrismaClient } = require('@prisma/client');

async function checkCustodians() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking custodian data...\n');

    const custodians = await prisma.users.findMany({
      where: { role: 'Custodian' },
      include: {
        laboratories: {
          select: {
            lab_id: true,
            lab_name: true,
            location: true
          }
        }
      }
    });

    console.log(`Found ${custodians.length} custodians:\n`);

    custodians.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name}`);
      console.log(`   User ID: ${user.user_id}`);
      console.log(`   Lab ID: ${user.lab_id || 'null'}`);
      console.log(`   Lab Name: ${user.laboratories?.lab_name || 'null'}`);
      console.log(`   Lab Location: ${user.laboratories?.location || 'null'}`);
      console.log('');
    });

    // Also check if any labs exist
    const labs = await prisma.laboratories.findMany();
    console.log(`\nFound ${labs.length} total laboratories:`);
    labs.forEach(lab => {
      console.log(`   - ${lab.lab_name} (ID: ${lab.lab_id})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustodians();
