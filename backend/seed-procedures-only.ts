import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding procedures only...');

  // Import the exported data
  const data = require('./data-export.json');

  // Clean up existing procedures and checklists
  await prisma.procedure_checklists.deleteMany();
  await prisma.procedures.deleteMany();

  console.log('Existing procedures cleaned up');

  // Create procedures
  for (const procedure of data.procedures) {
    try {
      await prisma.procedures.create({
        data: {
          procedure_id: procedure.procedure_id,
          procedure_name: procedure.procedure_name,
          description: procedure.description,
          category: procedure.category || 'General',
          is_active: procedure.is_active !== false,
          created_at: new Date(procedure.created_at),
        },
      });
      console.log(`✅ Created procedure: ${procedure.procedure_name}`);
    } catch (error) {
      console.error(`❌ Failed to create procedure ${procedure.procedure_name}:`, error);
    }
  }
  console.log('Procedures seeded');

  // Create procedure checklists
  for (const checklist of data.procedureChecklists) {
    try {
      await prisma.procedure_checklists.create({
        data: {
          checklist_id: checklist.checklist_id,
          procedure_id: checklist.procedure_id,
          checklist_name: checklist.checklist_name,
          description: checklist.description,
          order_sequence: checklist.order_sequence || 0,
          is_required: checklist.is_required !== false,
        },
      });
      console.log(`✅ Created checklist: ${checklist.checklist_name}`);
    } catch (error) {
      console.error(`❌ Failed to create checklist ${checklist.checklist_name}:`, error);
    }
  }
  console.log('Procedure checklists seeded');

  console.log('✅ Procedures seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during procedures seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
