import { prisma } from "../../config/database";

export class ServiceLogService {
  // GET Service History for a Workstation
  static async getServiceHistory(workstation_id: number, quarter?: string) {
    const whereClause: any = {
      pmc_reports: {
        workstation_id: Number(workstation_id),
      },
    };

    if (quarter) {
      whereClause.pmc_reports.quarter = String(quarter);
    }

    const serviceLogs = await prisma.service_logs.findMany({
      where: whereClause,
      orderBy: { service_date: "desc" },
      include: {
        users: {
          select: { user_id: true, full_name: true },
        },
        service_log_assets: {
          include: {
            inventory_assets: {
              include: {
                units: true,
                asset_details: true,
              },
            },
          },
        },
        service_log_procedures: {
          include: {
            procedures: true,
          },
        },
      },
    });

    return serviceLogs;
  }

  // CREATE Repair/Replacement Log
  static async createRepairLog(data: {
    workstation_id: number;
    quarter: string;
    lab_id: number;
    service_date: string;
    service_type?: string;
    remarks?: string;
    asset_actions?: Array<{
      asset_id: number;
      action?: string;
      status_before: string;
      status_after?: string;
      remarks?: string;
      old_property_tag?: string;
      new_property_tag?: string;
      new_serial_number?: string;
      new_description?: string;
      replacement_asset_id?: number;
    }>;
    user_id: number;
  }) {
    const result = await prisma.$transaction(async (tx) => {
      const {
        workstation_id,
        quarter,
        lab_id,
        service_date,
        service_type,
        remarks,
        asset_actions = [],
        user_id,
      } = data;

      // Find existing PMC report for this workstation + quarter
      const pmcReport = await tx.pmc_reports.findFirst({
        where: {
          workstation_id: Number(workstation_id),
          quarter: String(quarter),
        },
      });

      if (!pmcReport) {
        throw new Error(
          "No PMC report exists for this workstation and quarter. Please perform routine service first.",
        );
      }

      // Capture current status before changes
      const workstation_status_before = pmcReport.workstation_status;

      // Process asset actions
      for (const action of asset_actions) {
        if (action.action === "REPLACED") {
          // Decommission old asset
          await tx.inventory_assets.update({
            where: { asset_id: action.asset_id },
            data: { workstation_id: null },
          });

          // Update old asset status to decommissioned if status exists
          const oldAsset = await tx.inventory_assets.findUnique({
            where: { asset_id: action.asset_id },
            include: { asset_details: true },
          });

          if (oldAsset?.asset_details) {
            // Find "For Disposal" status for replaced assets
            const forDisposalStatus = await tx.asset_statuses.findFirst({
              where: { status_name: "For Disposal" },
            });

            if (forDisposalStatus) {
              await tx.asset_details.update({
                where: { detail_id: oldAsset.asset_details.detail_id },
                data: {
                  status_id: forDisposalStatus.status_id,
                  asset_remarks: `Replaced on ${new Date(service_date).toLocaleDateString()}. ${action.remarks || ""}`,
                },
              });
            }
          }

          // Create new asset if replacement details provided
          if (
            action.new_property_tag ||
            action.new_serial_number ||
            action.new_description
          ) {
            const newAsset = await tx.inventory_assets.create({
              data: {
                lab_id: Number(lab_id),
                workstation_id: Number(workstation_id),
                unit_id: oldAsset?.unit_id,
                added_by_user_id: Number(user_id),
                asset_details: {
                  create: {
                    property_tag_no: action.new_property_tag,
                    serial_number: action.new_serial_number,
                    description: action.new_description,
                    status_id: 1, // Functional
                    asset_remarks: `Replacement for asset ${action.asset_id}`,
                  },
                },
              },
            });

            // Store the replacement asset ID
            action.replacement_asset_id = newAsset.asset_id;
          }
        } else if (
          action.action === "REPAIRED" ||
          action.action === "UPGRADED"
        ) {
          // Update asset status
          const asset = await tx.inventory_assets.findUnique({
            where: { asset_id: action.asset_id },
            include: { asset_details: true },
          });

          if (asset?.asset_details) {
            // Find "Functional" status
            const functionalStatus = await tx.asset_statuses.findFirst({
              where: { status_name: "Functional" },
            });

            await tx.asset_details.update({
              where: { detail_id: asset.asset_details.detail_id },
              data: {
                status_id:
                  functionalStatus?.status_id || asset.asset_details.status_id,
                asset_remarks: action.remarks
                  ? `${action.action} on ${new Date(service_date).toLocaleDateString()}: ${action.remarks}`
                  : asset.asset_details.asset_remarks,
              },
            });
          }
        }
      }

      // Determine new workstation status
      let workstation_status_after = "Functional";
      const hasReplacements = asset_actions.some(
        (a: any) => a.action === "REPLACED",
      );
      const hasRepairs = asset_actions.some(
        (a: any) => a.action === "REPAIRED",
      );

      if (hasReplacements) {
        workstation_status_after = "Upgraded";
      } else if (hasRepairs) {
        workstation_status_after = "Functional";
      }

      // Create service log
      const serviceLog = await tx.service_logs.create({
        data: {
          pmc_id: pmcReport.pmc_id,
          service_type: service_type || "REPAIR",
          service_date: new Date(service_date),
          performed_by: Number(user_id),
          remarks,
          workstation_status_before,
          workstation_status_after,
          service_log_assets: {
            createMany: {
              data: asset_actions.map((action: any) => ({
                asset_id: action.asset_id,
                action: action.action,
                status_before: action.status_before,
                status_after: action.status_after || "Functional",
                remarks: action.remarks,
                old_property_tag: action.old_property_tag,
                new_property_tag: action.new_property_tag,
                replacement_asset_id: action.replacement_asset_id,
              })),
            },
          },
        },
      });

      // Update PMC report
      await tx.pmc_reports.update({
        where: { pmc_id: pmcReport.pmc_id },
        data: {
          service_count: { increment: 1 },
          workstation_status: workstation_status_after,
          report_date: new Date(service_date),
        },
      });

      return serviceLog;
    });

    return result;
  }
}
