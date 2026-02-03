import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking archived reports data...');

  // Get a sample archived report
  const archivedReport = await prisma.daily_reports.findFirst({
    where: { status: 'Approved' },
    include: {
      users: {
        select: { user_id: true, full_name: true, email: true }
      },
      laboratories: {
        select: { lab_id: true, lab_name: true, location: true }
      },
      report_workstation_items: {
        include: {
          workstations: {
            select: { workstation_id: true, workstation_name: true }
          }
        }
      },
      daily_report_procedures: {
        include: {
          procedures: {
            include: {
              procedure_checklists: true
            }
          },
          daily_report_checklist_responses: {
            include: {
              procedure_checklists: true
            }
          }
        }
      }
    }
  });

  if (archivedReport) {
    console.log(`\n✅ Found archived report #${archivedReport.report_id}:`);
    console.log(`- Status: ${archivedReport.status}`);
    console.log(`- Workstation items: ${archivedReport.report_workstation_items?.length || 0}`);
    console.log(`- Procedures: ${archivedReport.daily_report_procedures?.length || 0}`);
    
    if (archivedReport.report_workstation_items?.length > 0) {
      console.log('\n📋 Workstation Items:');
      archivedReport.report_workstation_items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.workstations?.workstation_name || 'Unknown'} - ${item.status}`);
      });
    }
    
    if (archivedReport.daily_report_procedures?.length > 0) {
      console.log('\n🔧 Procedures:');
      archivedReport.daily_report_procedures.forEach((rp, index) => {
        console.log(`  ${index + 1}. ${rp.procedures?.procedure_name || 'Unknown'} - ${rp.overall_status}`);
      });
    }
  } else {
    console.log('❌ No archived reports found');
  }

  // Check total counts
  const totalReports = await prisma.daily_reports.count();
  const approvedReports = await prisma.daily_reports.count({ where: { status: 'Approved' } });
  const pendingReports = await prisma.daily_reports.count({ where: { status: 'Pending' } });
  
  console.log(`\n📊 Report Statistics:`);
  console.log(`- Total reports: ${totalReports}`);
  console.log(`- Approved reports: ${approvedReports}`);
  console.log(`- Pending reports: ${pendingReports}`);

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
