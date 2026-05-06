import { prisma } from "../../config/database";
import {
  syncInventoryStatusWithMaintenance,
  syncIndividualAssetStatuses,
} from "./statusSyncService";

export class PMCReportService {
  // ============================================================================
  // PUBLIC API
  // ============================================================================

  static async getLabPMCReports(lab_id: number, quarter: string) {
    return prisma.pmc_reports.findMany({
      where: { lab_id, quarter },
      include: {
        pmc_report_procedures: { include: { procedures: true } },
        workstations: {
          select: { workstation_id: true, workstation_name: true },
        },
      },
    });
  }

  static async getPMCReportDetail(workstation_id: number, quarter: string) {
    const report = await prisma.pmc_reports.findFirst({
      where: { workstation_id, quarter },
      orderBy: { pmc_id: "desc" },
      include: {
        pmc_report_procedures: {
          include: {
            procedures: {
              select: { procedure_id: true, procedure_name: true },
            },
          },
        },
        service_logs: {
          orderBy: { service_date: "desc" },
          include: {
            users: { select: { user_id: true, full_name: true } },
            service_log_assets: {
              include: { inventory_assets: { include: { units: true } } },
            },
            service_log_procedures: {
              include: {
                procedures: {
                  select: { procedure_id: true, procedure_name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!report) return null;

    return {
      pmc_id: report.pmc_id,
      report_date: report.report_date,
      quarter: report.quarter,
      lab_id: report.lab_id,
      user_id: report.user_id,
      workstation_id: report.workstation_id,
      workstation_status: report.workstation_status,
      overall_remarks: report.overall_remarks,
      software_name: report.software_name,
      software_status: report.software_status,
      connectivity_type: report.connectivity_type,
      connectivity_type_status: report.connectivity_type_status,
      connectivity_speed: report.connectivity_speed,
      connectivity_speed_status: report.connectivity_speed_status,
      service_count: report.service_count,
      updated_at: report.updated_at,
      procedures:
        report.pmc_report_procedures?.map((proc: any) => ({
          procedure_id: proc.procedure_id,
          procedure_name:
            proc.procedures?.procedure_name || "Unknown Procedure",
          is_checked: proc.is_checked,
        })) || [],
    };
  }

  static async getWorkstationPMCReportsBatch(
    workstationIds: number[],
    quarter: string,
  ) {
    const reports = await prisma.pmc_reports.findMany({
      where: { workstation_id: { in: workstationIds }, quarter },
      include: {
        pmc_report_procedures: {
          include: {
            procedures: {
              select: { procedure_id: true, procedure_name: true },
            },
          },
        },
        service_logs: {
          orderBy: { service_date: "desc" },
          include: {
            users: { select: { user_id: true, full_name: true } },
            service_log_assets: {
              include: { inventory_assets: { include: { units: true } } },
            },
            service_log_procedures: {
              include: {
                procedures: {
                  select: { procedure_id: true, procedure_name: true },
                },
              },
            },
          },
        },
        workstations: {
          select: { workstation_id: true, workstation_name: true },
        },
      },
    });

    const result: Record<number, any> = {};
    workstationIds.forEach((id) => {
      result[id] = null;
    });

    reports.forEach((report) => {
      result[report.workstation_id] = {
        pmc_id: report.pmc_id,
        report_date: report.report_date,
        quarter: report.quarter,
        lab_id: report.lab_id,
        user_id: report.user_id,
        workstation_id: report.workstation_id,
        workstation_status: report.workstation_status,
        overall_remarks: report.overall_remarks,
        software_name: report.software_name,
        software_status: report.software_status,
        connectivity_type: report.connectivity_type,
        connectivity_type_status: report.connectivity_type_status,
        connectivity_speed: report.connectivity_speed,
        connectivity_speed_status: report.connectivity_speed_status,
        service_count: report.service_count,
        updated_at: report.updated_at,
        pmc_report_procedures:
          report.pmc_report_procedures?.map((proc: any) => ({
            id: proc.id,
            pmc_id: proc.pmc_id,
            procedure_id: proc.procedure_id,
            is_checked: proc.is_checked,
            remarks: proc.remarks,
            procedures: proc.procedures,
          })) || [],
        service_logs: report.service_logs || [],
        workstations: report.workstations,
      };
    });
    return result;
  }

  static async createPMCReport(data: any) {
    return prisma.$transaction(async (tx) => {
      // 1. Upsert the base report
      const { report, workstation_status_before } =
        await this._upsertReportRecord(tx, data);

      // 2. Sync inventory & asset statuses
      await this._syncWorkstationAndAssets(tx, data, report.workstation_id);

      // 3. Link procedures
      await this._linkProcedures(tx, report.pmc_id, data.procedure_ids);

      // 4. Generate the service log
      const serviceLog = await this._createServiceLog(
        tx,
        report.pmc_id,
        workstation_status_before,
        data,
      );

      return { report, serviceLog };
    });
  }

  // ============================================================================
  // PRIVATE HELPER METHODS (The magic that cleans up the class)
  // ============================================================================

  private static async _upsertReportRecord(tx: any, data: any) {
    const existingReport = await tx.pmc_reports.findFirst({
      where: {
        workstation_id: Number(data.workstation_id),
        quarter: String(data.quarter),
      },
    });

    let report;
    let workstation_status_before = "Unknown";

    if (existingReport) {
      workstation_status_before = existingReport.workstation_status;
      report = await tx.pmc_reports.update({
        where: { pmc_id: existingReport.pmc_id },
        data: {
          report_date: new Date(data.report_date),
          workstation_status: data.workstation_status,
          overall_remarks: data.overall_remarks,
          software_name: data.software_name,
          software_status: data.software_status,
          connectivity_type: data.connectivity_type,
          connectivity_type_status: data.connectivity_type_status,
          connectivity_speed: data.connectivity_speed,
          connectivity_speed_status: data.connectivity_speed_status,
          user_id: Number(data.user_id),
          service_count: { increment: 1 },
        },
      });
      await tx.pmc_report_procedures.deleteMany({
        where: { pmc_id: existingReport.pmc_id },
      });
    } else {
      report = await tx.pmc_reports.create({
        data: {
          lab_id: Number(data.lab_id),
          workstation_id: Number(data.workstation_id),
          user_id: Number(data.user_id),
          report_date: new Date(data.report_date),
          quarter: data.quarter,
          workstation_status: data.workstation_status,
          overall_remarks: data.overall_remarks,
          software_name: data.software_name,
          software_status: data.software_status,
          connectivity_type: data.connectivity_type,
          connectivity_type_status: data.connectivity_type_status,
          connectivity_speed: data.connectivity_speed,
          connectivity_speed_status: data.connectivity_speed_status,
          service_count: 1,
          updated_at: new Date(),
        },
      });
      workstation_status_before = "Not Previously Serviced";
    }

    return { report, workstation_status_before };
  }

  private static async _syncWorkstationAndAssets(
    tx: any,
    data: any,
    workstationId: number,
  ) {
    await syncInventoryStatusWithMaintenance(
      Number(workstationId),
      data.workstation_status,
      tx,
    );

    if (data.asset_actions && data.asset_actions.length > 0) {
      await syncIndividualAssetStatuses(data.asset_actions, tx);

      // Business Rule: Determine workstation status based on priority
      const statusPriority: Record<string, number> = {
        Lost: 4,
        "For Replacement": 3,
        "For Disposal": 2,
        "For Upgrade": 1,
        Functional: 0,
      };

      let workstationStatus = "Functional";
      let highestPriority = 0;

      for (const action of data.asset_actions) {
        const priority = statusPriority[action.status_after] || 0;
        if (priority > highestPriority) {
          highestPriority = priority;
          workstationStatus = action.status_after;
        }
      }

      await this._updateWorkstationStatus(tx, workstationId, workstationStatus);
    } else {
      await this._updateWorkstationStatus(
        tx,
        workstationId,
        data.workstation_status,
      );
    }
  }

  private static async _updateWorkstationStatus(
    tx: any,
    workstationId: number,
    statusName: string,
  ) {
    const statusRecord = await tx.asset_statuses.findFirst({
      where: { status_name: statusName },
    });
    if (statusRecord) {
      await tx.workstations.update({
        where: { workstation_id: workstationId },
        data: { status_id: statusRecord.status_id },
      });
    }
  }

  private static async _linkProcedures(
    tx: any,
    pmcId: number,
    procedureIds?: number[],
  ) {
    if (procedureIds && procedureIds.length > 0) {
      await tx.pmc_report_procedures.createMany({
        data: procedureIds.map((id: number) => ({
          pmc_id: pmcId,
          procedure_id: id,
          is_checked: true,
        })),
      });
    }
  }

  private static async _createServiceLog(
    tx: any,
    pmcId: number,
    statusBefore: string,
    data: any,
  ) {
    return tx.service_logs.create({
      data: {
        pmc_id: pmcId,
        service_type: data.service_type || "ROUTINE",
        service_date: new Date(data.report_date),
        performed_by: Number(data.user_id),
        remarks: data.overall_remarks,
        workstation_status_before: statusBefore,
        workstation_status_after: data.workstation_status,
        service_log_procedures:
          data.procedure_ids?.length > 0
            ? {
                createMany: {
                  data: data.procedure_ids.map((id: number) => ({
                    procedure_id: id,
                    is_checked: true,
                  })),
                },
              }
            : undefined,
        service_log_assets:
          data.asset_actions?.length > 0
            ? {
                createMany: {
                  data: data.asset_actions.map((action: any) => ({
                    asset_id: action.asset_id,
                    action: action.action || "CHECKED",
                    status_before: action.status_before,
                    status_after: action.status_after,
                    remarks: action.remarks,
                    old_property_tag: action.old_property_tag,
                    new_property_tag: action.new_property_tag,
                    replacement_asset_id: action.replacement_asset_id,
                  })),
                },
              }
            : undefined,
      },
    });
  }
}
