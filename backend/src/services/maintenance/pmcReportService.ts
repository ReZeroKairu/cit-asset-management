import { PrismaClient } from "@prisma/client";
import { syncInventoryStatusWithMaintenance, syncIndividualAssetStatuses } from "./statusSyncService";

const prisma = new PrismaClient();

export class PMCReportService {
  // GET Reports for a Lab & Quarter
  static async getLabPMCReports(lab_id: number, quarter: string) {
    const reports = await prisma.pmc_reports.findMany({
      where: {
        lab_id,
        quarter,
      },
      include: {
        pmc_report_procedures: {
          include: { procedures: true },
        },
        workstations: {
          select: {
            workstation_id: true,
            workstation_name: true,
          },
        },
      },
    });

    return reports;
  }

  // GET Single Report Details
  static async getPMCReportDetail(workstation_id: number, quarter: string) {
    const report = await prisma.pmc_reports.findFirst({
      where: {
        workstation_id,
        quarter,
      },
      orderBy: { pmc_id: "desc" },
      include: {
        pmc_report_procedures: {
          include: { 
            procedures: {
              select: {
                procedure_id: true,
                procedure_name: true,
              },
            },
          },
        },
        service_logs: {
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
                  },
                },
              },
            },
    
            service_log_procedures: {
              include: {
                procedures: {
                  select: {
                    procedure_id: true,
                    procedure_name: true,
                  },
                },
            
                
              },
            },
          },
        },
      },
    });
    
    if (!report) {
      return null;
    }

    // Transform response with procedures mapping
    const responseData = {
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
      procedures: report.pmc_report_procedures?.map((proc: any) => ({
        procedure_id: proc.procedure_id,
        procedure_name: proc.procedures?.procedure_name || 'Unknown Procedure',
        is_checked: proc.is_checked,
      })) || [],
    };

    return responseData;
  }

  // CREATE OR UPDATE A Report
  static async createPMCReport(data: {
    lab_id: number;
    workstation_id: number;
    report_date: string;
    quarter: string;
    workstation_status: string;
    overall_remarks?: string;
    software_name?: string;
    software_status?: string;
    connectivity_type?: string;
    connectivity_type_status?: string;
    connectivity_speed?: string;
    connectivity_speed_status?: string;
    procedure_ids?: number[];
    service_type?: string;
    asset_actions?: Array<{
      asset_id: number;
      action?: string;
      status_before: string;
      status_after: string;
      remarks?: string;
      old_property_tag?: string;
      new_property_tag?: string;
      replacement_asset_id?: number;
    }>;
    user_id: number;
  }) {
    const result = await prisma.$transaction(async (tx) => {
      const {
        lab_id,
        workstation_id,
        report_date,
        quarter,
        workstation_status,
        overall_remarks,
        software_name,
        software_status,
        connectivity_type,
        connectivity_type_status,
        connectivity_speed,
        connectivity_speed_status,
        procedure_ids,
        service_type = "ROUTINE",
        asset_actions = [],
        user_id,
      } = data;

      // Check if a report already exists for this workstation + quarter
      const existingReport = await tx.pmc_reports.findFirst({
        where: {
          workstation_id: Number(workstation_id),
          quarter: String(quarter),
        },
      });

      let report;
      let workstation_status_before = "Unknown";

      if (existingReport) {
        // Capture the status before update
        workstation_status_before = existingReport.workstation_status;

        // UPDATE the existing report and increment service_count
        report = await tx.pmc_reports.update({
          where: { pmc_id: existingReport.pmc_id },
          data: {
            report_date: new Date(report_date),
            workstation_status,
            overall_remarks,
            software_name,
            software_status,
            connectivity_type,
            connectivity_type_status,
            connectivity_speed,
            connectivity_speed_status,
            user_id: Number(user_id),
            service_count: { increment: 1 },
          },
        });

        // Delete old procedures and re-create
        await tx.pmc_report_procedures.deleteMany({
          where: { pmc_id: existingReport.pmc_id },
        });
      } else {
        // CREATE a new report with service_count: 1
        report = await tx.pmc_reports.create({
          data: {
            lab_id: Number(lab_id),
            workstation_id: Number(workstation_id),
            user_id: Number(user_id),
            report_date: new Date(report_date),
            quarter,
            workstation_status,
            overall_remarks,
            software_name,
            software_status,
            connectivity_type,
            connectivity_type_status,
            connectivity_speed,
            connectivity_speed_status,
            service_count: 1,
            updated_at: new Date(),
          },
        });

        workstation_status_before = "Not Previously Serviced";
      }

      // 🔄 SYNC: Update inventory status based on maintenance status
      await syncInventoryStatusWithMaintenance(Number(workstation_id), workstation_status, tx);

      // 🔄 SYNC: Update individual asset statuses if provided
      if (asset_actions && asset_actions.length > 0) {
        await syncIndividualAssetStatuses(asset_actions, tx);
      }

      // 🔄 SYNC: Update workstation table status based on individual asset statuses
      if (asset_actions && asset_actions.length > 0) {
        // Determine workstation status based on individual asset statuses
        const assetStatuses = asset_actions.map((action: any) => action.status_after);
        
        // Priority order: Lost > For Replacement > For Repair > For Upgrade > Functional
        const statusPriority: Record<string, number> = {
          'Lost': 4,
          'For Replacement': 3,
          'For Repair': 2,
          'For Upgrade': 1,
          'Functional': 0
        };
        
        // Find the highest priority status among individual assets
        let workstationStatus = 'Functional';
        let highestPriority = 0;
        
        for (const status of assetStatuses) {
          const priority = statusPriority[status] || 0;
          if (priority > highestPriority) {
            highestPriority = priority;
            workstationStatus = status;
          }
        }
        
        // Update workstation with the determined status
        const workstationStatusRecord = await tx.asset_statuses.findFirst({
          where: { status_name: workstationStatus }
        });

        if (workstationStatusRecord) {
          await tx.workstations.update({
            where: { workstation_id: Number(workstation_id) },
            data: { 
              status_id: workstationStatusRecord.status_id 
            }
          });
        }
      } else {
        // Fallback to overall workstation status if no individual asset actions
        const workstationStatusRecord = await tx.asset_statuses.findFirst({
          where: { status_name: workstation_status }
        });

        if (workstationStatusRecord) {
          await tx.workstations.update({
            where: { workstation_id: Number(workstation_id) },
            data: { 
              status_id: workstationStatusRecord.status_id 
            }
          });
        }
      }

      // Link procedures
      if (procedure_ids && procedure_ids.length > 0) {
        await tx.pmc_report_procedures.createMany({
          data: procedure_ids.map((id: number) => ({
            pmc_id: report.pmc_id,
            procedure_id: id,
            is_checked: true,
          })),
        });
      }

      // Create service log entry
      const serviceLog = await tx.service_logs.create({
        data: {
          pmc_id: report.pmc_id,
          service_type: service_type,
          service_date: new Date(report_date),
          performed_by: Number(user_id),
          remarks: overall_remarks,
          workstation_status_before,
          workstation_status_after: workstation_status,
          service_log_procedures:
            procedure_ids && procedure_ids.length > 0
              ? {
                  createMany: {
                    data: procedure_ids.map((id: number) => ({
                      procedure_id: id,
                      is_checked: true,
                    })),
                  },
                }
              : undefined,
          service_log_assets:
            asset_actions.length > 0
              ? {
                  createMany: {
                    data: asset_actions.map((action: any) => ({
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
      
      return { report, serviceLog };
    });

    return result;
  }

  // GET Multiple Reports for Workstations (Batch method)
  static async getWorkstationPMCReportsBatch(workstationIds: number[], quarter: string) {
    const reports = await prisma.pmc_reports.findMany({
      where: {
        workstation_id: { in: workstationIds },
        quarter,
      },
      include: {
        pmc_report_procedures: {
          include: { 
            procedures: {
              select: {
                procedure_id: true,
                procedure_name: true,
              },
            },
          },
        },
        service_logs: {
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
                  },
                },
              },
            },
            service_log_procedures: {
              include: {
                procedures: {
                  select: {
                    procedure_id: true,
                    procedure_name: true,
                  },
                },
              },
            },
          },
        },
        workstations: {
          select: {
            workstation_id: true,
            workstation_name: true,
          },
        },
      },
    });

    // Convert to Record<number, PMCReport | null> format
    const result: Record<number, any> = {};
    
    // Initialize all workstations with null
    workstationIds.forEach(id => {
      result[id] = null;
    });

    // Map found reports to their workstation IDs
    reports.forEach(report => {
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
        pmc_report_procedures: report.pmc_report_procedures?.map((proc: any) => ({
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
}
