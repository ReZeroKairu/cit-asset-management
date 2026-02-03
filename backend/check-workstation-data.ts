import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking workstation data structure...');

  const workstations = await prisma.workstations.findMany({
    include: {
      laboratories: {
        select: {
          lab_name: true,
          location: true,
        },
      },
      inventory_assets: {
        include: {
          details: {
            select: {
              property_tag_no: true,
              serial_number: true,
              description: true,
            },
          },
          units: {
            select: {
              unit_name: true,
            },
          },
        },
      },
    },
    take: 2
  });

  if (workstations.length > 0) {
    console.log('\n✅ Sample Workstation Data Structure:');
    console.log(JSON.stringify(workstations[0], null, 2));
    
    console.log('\n📋 Field Names:');
    console.log('- laboratories field:', workstations[0].laboratories ? 'EXISTS' : 'NULL');
    console.log('- inventory_assets field:', workstations[0].inventory_assets ? 'EXISTS' : 'NULL');
    
    if (workstations[0].laboratories) {
      console.log('- lab_name:', workstations[0].laboratories.lab_name);
      console.log('- location:', workstations[0].laboratories.location);
    }
  } else {
    console.log('❌ No workstations found');
  }

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
