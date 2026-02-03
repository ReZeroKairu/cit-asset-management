import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking related tables data...');

  // Check report_workstation_items
  const workstationItems = await prisma.report_workstation_items.count();
  console.log(`📋 Report Workstation Items: ${workstationItems}`);

  // Check daily_report_procedures
  const reportProcedures = await prisma.daily_report_procedures.count();
  console.log(`🔧 Daily Report Procedures: ${reportProcedures}`);

  // Check daily_report_checklist_responses
  const checklistResponses = await prisma.daily_report_checklist_responses.count();
  console.log(`✅ Checklist Responses: ${checklistResponses}`);

  // Get sample data from each table
  if (workstationItems > 0) {
    const sampleWS = await prisma.report_workstation_items.findFirst();
    console.log(`\n📋 Sample Workstation Item: Report ID ${sampleWS?.report_id}`);
  }

  if (reportProcedures > 0) {
    const sampleProc = await prisma.daily_report_procedures.findFirst();
    console.log(`\n🔧 Sample Procedure: Report ID ${sampleProc?.report_id}`);
  }

  if (checklistResponses > 0) {
    const sampleResp = await prisma.daily_report_checklist_responses.findFirst();
    console.log(`\n✅ Sample Response: Report Procedure ID ${sampleResp?.report_procedure_id}`);
  }

  // Check which reports have detailed data
  const reportsWithDetails = await prisma.daily_reports.findMany({
    where: {
      OR: [
        { report_workstation_items: { some: {} } },
        { daily_report_procedures: { some: {} } }
      ]
    },
    select: {
      report_id: true,
      status: true,
      report_workstation_items: { select: { report_id: true } },
      daily_report_procedures: { select: { report_id: true } }
    },
    take: 5
  });

  console.log(`\n📊 Reports with detailed data: ${reportsWithDetails.length}`);
  reportsWithDetails.forEach(report => {
    console.log(`- Report #${report.report_id} (${report.status}): ${report.report_workstation_items.length} WS items, ${report.daily_report_procedures.length} procedures`);
  });

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
