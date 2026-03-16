const { PrismaClient } = require('@prisma/client');

async function assignCustodianToLab() {
  const prisma = new PrismaClient();

  try {
    console.log('🔧 Assigning custodian to a laboratory...\n');

    // Get first available lab
    const lab = await prisma.laboratories.findFirst();
    if (!lab) {
      console.log('❌ No laboratories found in database');
      return;
    }

    console.log(`Found lab: ${lab.lab_name} (ID: ${lab.lab_id})`);

    // Get or create a custodian
    let custodian = await prisma.users.findFirst({
      where: { role: 'Custodian' }
    });

    if (!custodian) {
      console.log('Creating a test custodian...');
      custodian = await prisma.users.create({
        data: {
          full_name: 'Test Custodian',
          email: 'custodian@test.com',
          password_hash: '$2b$10$hashedpasswordhere', // This would be properly hashed in real use
          role: 'Custodian',
          lab_id: lab.lab_id
        }
      });
      console.log(`✅ Created custodian: ${custodian.full_name} (ID: ${custodian.user_id})`);
    } else {
      console.log(`Found existing custodian: ${custodian.full_name} (ID: ${custodian.user_id})`);

      // Update custodian to have lab assignment
      custodian = await prisma.users.update({
        where: { user_id: custodian.user_id },
        data: { lab_id: lab.lab_id }
      });
      console.log(`✅ Assigned custodian to lab: ${lab.lab_name}`);
    }

    // Update lab's in_charge_id
    await prisma.laboratories.update({
      where: { lab_id: lab.lab_id },
      data: { in_charge_id: custodian.user_id }
    });

    console.log('\n✅ Custodian assignment complete!');
    console.log(`Custodian ${custodian.full_name} is now assigned to ${lab.lab_name}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignCustodianToLab();
