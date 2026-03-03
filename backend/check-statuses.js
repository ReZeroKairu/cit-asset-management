const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStatuses() {
  try {
    const statuses = await prisma.asset_statuses.findMany();
    console.log('Available statuses:');
    statuses.forEach(status => {
      console.log(`- ${status.status_name} (ID: ${status.status_id})`);
    });
    
    console.log('\nChecking for specific statuses:');
    const forUpgrade = statuses.find(s => s.status_name === 'For Upgrade');
    const forRepair = statuses.find(s => s.status_name === 'For Repair');
    const forReplacement = statuses.find(s => s.status_name === 'For Replacement');
    
    console.log(`For Upgrade: ${forUpgrade ? 'EXISTS' : 'MISSING'}`);
    console.log(`For Repair: ${forRepair ? 'EXISTS' : 'MISSING'}`);
    console.log(`For Replacement: ${forReplacement ? 'EXISTS' : 'MISSING'}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatuses();
