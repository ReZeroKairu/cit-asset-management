//backend/scripts/export-current-data.ts
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function exportData() {
  console.log("Exporting current data...\n");

  try {
    // Export core data that exists
    const campuses = await prisma.campuses.findMany();
    const departments = await prisma.departments.findMany();
    const laboratories = await prisma.laboratories.findMany();
    const users = await prisma.users.findMany();
    const daily_reports = await prisma.daily_reports.findMany();

    const exportData = {
      exportDate: new Date().toISOString(),
      campuses,
      departments,
      laboratories,
      users,
      daily_reports,
    };

    // Save to file
    const exportPath = path.join(__dirname, "../data-export.json");
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

    console.log(`✅ Data exported successfully!\n`);
    console.log(`📁 Export file: ${exportPath}\n`);
    console.log(`📊 Summary:`);
    console.log(`   - Campuses: ${campuses.length}`);
    console.log(`   - Departments: ${departments.length}`);
    console.log(`   - Laboratories: ${laboratories.length}`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Daily Reports: ${daily_reports.length}\n`);
  } catch (error) {
    console.error("❌ Error exporting data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
