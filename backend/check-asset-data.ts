import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking asset data structure...');

  const assets = await prisma.inventory_assets.findMany({
    include: {
      details: true,
      laboratories: true,
      units: true,
      users: true,
      workstations: true,
    },
    take: 3
  });

  if (assets.length > 0) {
    console.log('\n✅ Sample Asset Data Structure:');
    console.log(JSON.stringify(assets[0], null, 2));
    
    console.log('\n📋 Field Names:');
    console.log('- laboratories field:', assets[0].laboratories ? 'EXISTS' : 'NULL');
    console.log('- details field:', assets[0].details ? 'EXISTS' : 'NULL');
    console.log('- units field:', assets[0].units ? 'EXISTS' : 'NULL');
    
    if (assets[0].laboratories) {
      console.log('- lab_name:', assets[0].laboratories.lab_name);
    }
    if (assets[0].details) {
      console.log('- details fields:', Object.keys(assets[0].details));
    }
  } else {
    console.log('❌ No assets found');
  }

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
