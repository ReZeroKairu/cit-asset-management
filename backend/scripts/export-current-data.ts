//backend/scripts/export-current-data.ts
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function exportData() {
  console.log("Exporting current data...");

  try {
    // Export all data
    const campuses = await prisma.campuses.findMany();
    const officeTypes = await prisma.office_types.findMany();
    const departments = await prisma.departments.findMany();
    const deviceTypes = await prisma.device_types.findMany();
    const units = await prisma.units.findMany();
    const procedures = await prisma.procedures.findMany();
    const procedureChecklists = await prisma.procedure_checklists.findMany();
    const users = await prisma.users.findMany();
    const laboratories = await prisma.laboratories.findMany();
    const workstations = await prisma.workstations.findMany();
    const inventoryAssets = await prisma.inventory_assets.findMany({
      include: { details: true },
    });
    const dailyReports = await prisma.daily_reports.findMany({
      include: {
        users: true,
        laboratories: true,
      },
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      campuses,
      officeTypes,
      departments,
      deviceTypes,
      units,
      procedures,
      procedureChecklists,
      users,
      laboratories,
      workstations,
      inventoryAssets,
      dailyReports,
    };

    // Save to file
    const exportPath = path.join(__dirname, "../data-export.json");
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

    console.log(`Data exported to: ${exportPath}`);
    console.log(`Summary:`);
    console.log(`- Campuses: ${campuses.length}`);
    console.log(`- Departments: ${departments.length}`);
    console.log(`- Users: ${users.length}`);
    console.log(`- Laboratories: ${laboratories.length}`);
    console.log(`- Workstations: ${workstations.length}`);
    console.log(`- Inventory Assets: ${inventoryAssets.length}`);
    console.log(`- Daily Reports: ${dailyReports.length}`);
  } catch (error) {
    console.error("Error exporting data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
