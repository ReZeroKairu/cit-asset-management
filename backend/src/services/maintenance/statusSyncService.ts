import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🔄 SYNC: Use exact same statuses for maintenance and inventory
export const syncInventoryStatusWithMaintenance = async (
  workstationId: number,
  maintenanceStatus: string,
  tx: any
) => {
  try {
    // Use exact same statuses - no mapping needed
    const targetStatusName = maintenanceStatus; // Use status directly
    
    // Find status ID
    const statusRecord = await tx.asset_statuses.findFirst({
      where: { status_name: targetStatusName }
    });

    if (!statusRecord) {
      console.error("❌ Status not found:", targetStatusName);
      return;
    }

    // Find all assets for this workstation
    const workstationAssets = await tx.inventory_assets.findMany({
      where: { workstation_id: workstationId },
      include: {
        asset_details: {
          select: { detail_id: true, status_id: true }
        }
      }
    });
    
    // Update all assets for this workstation
    if (workstationAssets.length > 0) {
      await tx.asset_details.updateMany({
        where: {
          detail_id: {
            in: workstationAssets
              .filter((a: any) => a.asset_details)
              .map((a: any) => a.asset_details!.detail_id)
          }
        },
        data: {
          status_id: statusRecord.status_id
        }
      });
    }

  } catch (error) {
    console.error("❌ STATUS SYNC ERROR:", error);
    // Don't throw - don't break the maintenance report creation
  }
};

// 🔄 SYNC: Update individual asset statuses based on maintenance form
export const syncIndividualAssetStatuses = async (
  assetActions: Array<{
    asset_id: number;
    action?: string;
    status_before: string;
    status_after: string;
    remarks?: string;
    old_property_tag?: string;
    new_property_tag?: string;
    replacement_asset_id?: number;
  }>,
  tx: any
) => {
  try {
    for (const assetAction of assetActions) {
      // Find status ID for the new status
      const statusRecord = await tx.asset_statuses.findFirst({
        where: { status_name: assetAction.status_after }
      });

      if (!statusRecord) {
        console.error("❌ Status not found for asset:", assetAction.asset_id, assetAction.status_after);
        continue;
      }

      // Update individual asset status
      await tx.asset_details.updateMany({
        where: {
          asset_id: assetAction.asset_id
        },
        data: {
          status_id: statusRecord.status_id
        }
      });
    }

  } catch (error) {
    console.error("❌ INDIVIDUAL ASSET SYNC ERROR:", error);
    // Don't throw - don't break maintenance report creation
  }
};
