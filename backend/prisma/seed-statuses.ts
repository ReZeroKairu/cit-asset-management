import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedStatuses() {
  console.log('🌱 Seeding asset statuses...');

  try {
    // Insert default asset statuses
    await prisma.asset_statuses.createMany({
      data: [
        { status_id: 1, status_name: 'Functional' },
        { status_id: 2, status_name: 'For Repair' },
        { status_id: 3, status_name: 'Out of Service' },
        { status_id: 4, status_name: 'Replacement Needed' }
      ],
      skipDuplicates: true
    });

    console.log('✅ Asset statuses seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding statuses:', error);
  }
}

seedStatuses()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
