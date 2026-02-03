import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking workstation-lab relationships...');

  // 1. Check all workstations
  const allWorkstations = await prisma.workstations.findMany({
    select: {
      workstation_id: true,
      workstation_name: true,
      lab_id: true,
      created_at: true,
    },
  });

  console.log('\n📋 All Workstations:');
  allWorkstations.forEach(ws => {
    console.log(`- ${ws.workstation_name} (ID: ${ws.workstation_id}) -> lab_id: ${ws.lab_id}`);
  });

  // 2. Check if labs exist
  const allLabs = await prisma.laboratories.findMany({
    select: {
      lab_id: true,
      lab_name: true,
      location: true,
    },
  });

  console.log('\n🏢 Available Laboratories:');
  allLabs.forEach(lab => {
    console.log(`- ${lab.lab_name} (ID: ${lab.lab_id}) - ${lab.location}`);
  });

  // 3. Test the actual query with includes
  console.log('\n🔍 Testing actual API query...');
  const workstationsWithLabs = await prisma.workstations.findMany({
    include: {
      laboratories: {
        select: {
          lab_name: true,
          location: true,
        },
      },
    },
    take: 3,
  });

  workstationsWithLabs.forEach(ws => {
    console.log(`\nWorkstation: ${ws.workstation_name}`);
    console.log(`- lab_id: ${ws.lab_id}`);
    console.log(`- laboratories field: ${ws.laboratories ? 'EXISTS' : 'NULL'}`);
    if (ws.laboratories) {
      console.log(`- lab_name: ${ws.laboratories.lab_name}`);
      console.log(`- location: ${ws.laboratories.location}`);
    } else {
      console.log('- ❌ No laboratory data found');
    }
  });

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
