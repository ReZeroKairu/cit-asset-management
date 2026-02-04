import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding with filtered backup data...');

  // Read the backup data
  const backupPath = path.join(__dirname, '..', 'data-export.json');
  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

  try {
    // Clear existing data (in correct order due to foreign key constraints)
    console.log('🗑️  Clearing existing data...');
    await prisma.report_workstation_items.deleteMany();
    await prisma.daily_report_checklist_responses.deleteMany();
    await prisma.daily_report_procedures.deleteMany();
    await prisma.procedures.deleteMany();
    await prisma.workstations.deleteMany();
    await prisma.asset_details.deleteMany();
    await prisma.inventory_assets.deleteMany();
    await prisma.users.deleteMany();
    await prisma.laboratories.deleteMany();
    await prisma.departments.deleteMany();
    await prisma.units.deleteMany();
    await prisma.device_types.deleteMany();
    await prisma.office_types.deleteMany();
    await prisma.campuses.deleteMany();

    console.log('📊 Inserting filtered data...');

    // Insert campuses
    if (backupData.campuses?.length > 0) {
      await prisma.campuses.createMany({
        data: backupData.campuses,
        skipDuplicates: true
      });
      console.log(`✅ Inserted ${backupData.campuses.length} campuses`);
    }

    // Insert office types
    if (backupData.officeTypes?.length > 0) {
      await prisma.office_types.createMany({
        data: backupData.officeTypes,
        skipDuplicates: true
      });
      console.log(`✅ Inserted ${backupData.officeTypes.length} office types`);
    }

    // Insert departments
    if (backupData.departments?.length > 0) {
      await prisma.departments.createMany({
        data: backupData.departments,
        skipDuplicates: true
      });
      console.log(`✅ Inserted ${backupData.departments.length} departments`);
    }

    // Insert laboratories
    if (backupData.laboratories?.length > 0) {
      await prisma.laboratories.createMany({
        data: backupData.laboratories,
        skipDuplicates: true
      });
      console.log(`✅ Inserted ${backupData.laboratories.length} laboratories`);
    }

    // Insert users
    if (backupData.users?.length > 0) {
      await prisma.users.createMany({
        data: backupData.users,
        skipDuplicates: true
      });
      console.log(`✅ Inserted ${backupData.users.length} users`);
    }

    // Insert device types
    if (backupData.deviceTypes?.length > 0) {
      await prisma.device_types.createMany({
        data: backupData.deviceTypes,
        skipDuplicates: true
      });
      console.log(`✅ Inserted ${backupData.deviceTypes.length} device types`);
    }

    // Insert units
    if (backupData.units?.length > 0) {
      await prisma.units.createMany({
        data: backupData.units,
        skipDuplicates: true
      });
      console.log(`✅ Inserted ${backupData.units.length} units`);
    }

    // Insert workstations
    if (backupData.workstations?.length > 0) {
      await prisma.workstations.createMany({
        data: backupData.workstations,
        skipDuplicates: true
      });
      console.log(`✅ Inserted ${backupData.workstations.length} workstations`);
    }

    // Insert inventory assets
    if (backupData.inventoryAssets?.length > 0) {
      const inventoryAssetsWithoutDetails = backupData.inventoryAssets.map((asset: any) => {
        const { details, ...assetWithoutDetails } = asset;
        return assetWithoutDetails;
      });

      await prisma.inventory_assets.createMany({
        data: inventoryAssetsWithoutDetails,
        skipDuplicates: true
      });
      console.log(`✅ Inserted ${inventoryAssetsWithoutDetails.length} inventory assets`);
    }

    // Insert asset details
    if (backupData.assetDetails?.length > 0) {
      await prisma.asset_details.createMany({
        data: backupData.assetDetails,
        skipDuplicates: true
      });
      console.log(`✅ Inserted ${backupData.assetDetails.length} asset details`);
    }

    // Insert procedures WITHOUT description field
    if (backupData.procedures?.length > 0) {
      const proceduresWithoutDescription = backupData.procedures.map((proc: any) => ({
        procedure_id: proc.procedure_id,
        procedure_name: proc.procedure_name,
        category: proc.category,
        is_active: proc.is_active,
        created_at: proc.created_at
        // description field intentionally excluded
      }));

      await prisma.procedures.createMany({
        data: proceduresWithoutDescription,
        skipDuplicates: true
      });
      console.log(`✅ Inserted ${proceduresWithoutDescription.length} procedures (without descriptions)`);
    }

    // Insert daily report procedures
    if (backupData.dailyReportProcedures?.length > 0) {
      await prisma.daily_report_procedures.createMany({
        data: backupData.dailyReportProcedures,
        skipDuplicates: true
      });
      console.log(`✅ Inserted ${backupData.dailyReportProcedures.length} daily report procedures`);
    }

    // Insert daily report checklist responses
    if (backupData.dailyReportChecklistResponses?.length > 0) {
      await prisma.daily_report_checklist_responses.createMany({
        data: backupData.dailyReportChecklistResponses,
        skipDuplicates: true
      });
      console.log(`✅ Inserted ${backupData.dailyReportChecklistResponses.length} daily report checklist responses`);
    }

    // Insert report workstation items
    if (backupData.reportWorkstationItems?.length > 0) {
      await prisma.report_workstation_items.createMany({
        data: backupData.reportWorkstationItems,
        skipDuplicates: true
      });
      console.log(`✅ Inserted ${backupData.reportWorkstationItems.length} report workstation items`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('📝 Note: procedureChecklists data was excluded as requested');
    console.log('📝 Note: procedure descriptions were removed as requested');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
