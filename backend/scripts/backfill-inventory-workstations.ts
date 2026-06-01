import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfill() {
  console.log("Starting backfill: inventory_workstations for auto_inventory reports...");
  try {
    const reports = await prisma.daily_reports.findMany({
      where: { report_type: 'auto_inventory' },
      select: { report_id: true, generated_data: true }
    });

    console.log(`Found ${reports.length} auto_inventory reports.`);

    let updated = 0;

    for (const r of reports) {
      const gen = (r as any).generated_data || {};
      const items = Array.isArray(gen.inventory_items) ? gen.inventory_items : [];
      const hasWs = Array.isArray(gen.inventory_workstations) && gen.inventory_workstations.length > 0;

      if (items.length === 0) continue;
      if (hasWs) continue; // already has workstation list

      // Build unique workstation list
      const invWs = Array.from(
        items.reduce((acc: Map<string, any>, asset: any) => {
          const workstationName = asset.workstation_name || asset.workstation || 'Unassigned';
          if (!acc.has(workstationName)) acc.set(workstationName, { workstation_name: workstationName, remarks: null });
          return acc;
        }, new Map<string, any>()).values()
      );

      const newGen = { ...gen, inventory_workstations: invWs };

      await prisma.daily_reports.update({
        where: { report_id: r.report_id },
        data: { generated_data: newGen }
      });

      updated += 1;
      console.log(`Updated report ${r.report_id} with ${invWs.length} inventory_workstations.`);
    }

    console.log(`Backfill complete. Updated ${updated} reports.`);
  } catch (err) {
    console.error('Backfill failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

backfill();
