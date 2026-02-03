import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking procedures in database...');

  const procedures = await prisma.procedures.findMany();
  console.log(`Found ${procedures.length} procedures:`);
  
  procedures.forEach(proc => {
    console.log(`- ${proc.procedure_name} (ID: ${proc.procedure_id})`);
  });

  const checklists = await prisma.procedure_checklists.findMany();
  console.log(`\nFound ${checklists.length} procedure checklists:`);
  
  checklists.forEach(checklist => {
    console.log(`- ${checklist.checklist_name} (Procedure ID: ${checklist.procedure_id})`);
  });

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
