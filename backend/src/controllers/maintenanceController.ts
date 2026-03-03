import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. GET Reports for a Lab & Quarter
export const getLabPMCReports = async (req: Request, res: Response) => {
  try {
    const { lab_id, quarter } = req.query;

    if (!lab_id || !quarter) {
      return res.status(400).json({ error: "Lab ID and Quarter are required" });
    }

    const reports = await prisma.pmc_reports.findMany({
      where: {
        lab_id: Number(lab_id),
        quarter: String(quarter),
      },
      include: {
        pmc_report_procedures: {
          include: { procedures: true },
        },
      },
    });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

// 2. GET Single Report Details (For the View)
export const getPMCReportDetail = async (req: Request, res: Response) => {
  try {
    const { workstation_id, quarter } = req.query;

    const report = await prisma.pmc_reports.findFirst({
      where: {
        workstation_id: Number(workstation_id),
        quarter: String(quarter),
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
      return res.status(404).json({ error: "Report not found" });
    }

    // ✅ FIX: Simple response with procedures mapping
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

    res.json(responseData);
  } catch (error) {
    console.error("❌ GET PMC REPORT DETAIL - Error:", error);
    res.status(500).json({ error: "Failed to fetch report detail" });
  }
};

// 3. CREATE OR UPDATE A Report
export const createPMCReport = async (req: Request, res: Response) => {
  try {
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
    } = req.body;

    const user_id = req.user?.userId;

    // ✅ LOGGING: Log incoming data for debugging
    console.log("🔧 CREATE PMC REPORT - Incoming Data:", {
      lab_id,
      workstation_id,
      quarter,
      workstation_status,
      overall_remarks: overall_remarks || "MISSING",
      software_name,
      software_status,
      connectivity_type,
      connectivity_type_status,
      connectivity_speed,
      connectivity_speed_status,
      procedure_ids,
      service_type,
      asset_actions_count: asset_actions.length,
      user_id,
    });

    const result = await prisma.$transaction(async (tx) => {
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

        console.log("📝 UPDATING EXISTING PMC REPORT:", {
          pmc_id: existingReport.pmc_id,
          current_overall_remarks: existingReport.overall_remarks || "NONE",
          new_overall_remarks: overall_remarks || "MISSING",
        });

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

        console.log("✅ PMC REPORT UPDATED:", {
          pmc_id: report.pmc_id,
          saved_overall_remarks: report.overall_remarks || "NULL",
        });

        // Delete old procedures and re-create
        await tx.pmc_report_procedures.deleteMany({
          where: { pmc_id: existingReport.pmc_id },
        });
      } else {
        console.log("🆕 CREATING NEW PMC REPORT:", {
          overall_remarks: overall_remarks || "MISSING",
        });

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

        console.log("✅ PMC REPORT CREATED:", {
          pmc_id: report.pmc_id,
          saved_overall_remarks: report.overall_remarks || "NULL",
        });
        workstation_status_before = "Not Previously Serviced";
      }

      // 🔄 SYNC: Update inventory status based on maintenance status
      console.log("🔄 STARTING SYNC:", {
        workstation_id: Number(workstation_id),
        workstation_status,
        status_type: typeof workstation_status
      });
      
      await syncInventoryStatusWithMaintenance(Number(workstation_id), workstation_status, tx);

      // Link procedures
      if (procedure_ids && procedure_ids.length > 0) {
        console.log("🔗 LINKING PROCEDURES:", {
          pmc_id: report.pmc_id,
          procedure_ids,
          count: procedure_ids.length,
        });

        await tx.pmc_report_procedures.createMany({
          data: procedure_ids.map((id: number) => ({
            pmc_id: report.pmc_id,
            procedure_id: id,
            is_checked: true,
          })),
        });

        console.log("✅ PROCEDURES LINKED SUCCESSFULLY");
      } else {
        console.log("⚠️ NO PROCEDURES TO LINK - procedure_ids array is empty");
      }

      // Create service log entry
      console.log("📋 CREATING SERVICE LOG:", {
        pmc_id: report.pmc_id,
        service_type,
        service_date: report_date,
        performed_by: user_id,
        remarks: overall_remarks || "MISSING",
        workstation_status_before,
        workstation_status_after: workstation_status,
      });

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

      console.log("✅ SERVICE LOG CREATED:", {
        log_id: serviceLog.log_id,
        saved_remarks: serviceLog.remarks || "NULL",
      });

      return { report, serviceLog };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Create PMC Error:", error);
    res.status(500).json({ error: "Failed to create report" });
  }
};

// 4. GET Service History for a Workstation
export const getServiceHistory = async (req: Request, res: Response) => {
  try {
    const { workstation_id, quarter } = req.query;

    if (!workstation_id) {
      return res.status(400).json({ error: "Workstation ID is required" });
    }

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

    res.json(serviceLogs);
  } catch (error) {
    console.error("Get Service History Error:", error);
    res.status(500).json({ error: "Failed to fetch service history" });
  }
};

// 5. CREATE Repair/Replacement Log
export const createRepairLog = async (req: Request, res: Response) => {
  try {
    const {
      workstation_id,
      quarter,
      lab_id,
      service_date,
      service_type,
      remarks,
      asset_actions = [],
    } = req.body;

    const user_id = req.user?.userId;

    if (!workstation_id || !quarter) {
      return res
        .status(400)
        .json({ error: "Workstation ID and Quarter are required" });
    }

    const result = await prisma.$transaction(async (tx) => {
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
            // Find "Decommissioned" or "Disposed" status
            const decommissionedStatus = await tx.asset_statuses.findFirst({
              where: {
                OR: [
                  { status_name: "Decommissioned" },
                  { status_name: "Disposed" },
                  { status_name: "Replaced" },
                ],
              },
            });

            await tx.asset_details.update({
              where: { detail_id: oldAsset.asset_details.detail_id },
              data: {
                status_id:
                  decommissionedStatus?.status_id || oldAsset.asset_details.status_id,
                asset_remarks: `Replaced on ${new Date(service_date).toLocaleDateString()}. ${action.remarks || ""}`,
              },
            });
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

    res.status(201).json(result);
  } catch (error: any) {
    console.error("Create Repair Log Error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to create repair log" });
  }
};

// 6. GET Preventive Maintenance Analytics for Dashboard
export const getMaintenanceAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    
    let whereClause = {};
    
    // For custodians, only get analytics from their assigned lab
    if (userRole === "Custodian" && userId) {
      const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: { lab_id: true }
      });
      
      if (user?.lab_id) {
        whereClause = { lab_id: user.lab_id };
      }
    }
    
    // Get total workstations count
    const totalWorkstations = await prisma.workstations.count({
      where: whereClause
    });
    
    // Get completed PMC reports (current quarter)
    const currentQuarter = getCurrentQuarter();
    const completedReports = await prisma.pmc_reports.count({
      where: {
        ...whereClause,
        quarter: currentQuarter
      }
    });
    
    // Get workstation status distribution (current quarter only)
    const statusDistribution = await prisma.pmc_reports.groupBy({
      by: ['workstation_status'],
      where: {
        ...whereClause,
        quarter: currentQuarter
      },
      _count: {
        pmc_id: true
      }
    });
    
    // Get lab-wise completion rates (current quarter only)
    const labWiseData = await prisma.pmc_reports.groupBy({
      by: ['lab_id'],
      where: {
        ...whereClause,
        quarter: currentQuarter
      },
      _count: {
        pmc_id: true
      }
    });
    
    // For admin users, get detailed per-lab analytics
    let perLabAnalytics: Array<{
      lab_id: number;
      lab_name: string;
      totalWorkstations: number;
      completedReports: number;
      uniqueWorkstationsWithMaintenance: number;
      completionRate: number;
    }> = [];
    if (userRole === "Admin") {
      // Get all labs for admin view
      const allLabs = await prisma.laboratories.findMany({
        select: {
          lab_id: true,
          lab_name: true
        }
      });
      
      // Get analytics for each lab
      perLabAnalytics = await Promise.all(
        allLabs.map(async (lab) => {
          const labWorkstations = await prisma.workstations.count({
            where: { lab_id: lab.lab_id }
          });
          
          const labReports = await prisma.pmc_reports.count({
            where: {
              lab_id: lab.lab_id,
              quarter: currentQuarter
            }
          });
          
          const labWorkstationReports = await prisma.pmc_reports.findMany({
            where: {
              lab_id: lab.lab_id,
              quarter: currentQuarter
            },
            select: { workstation_id: true }
          });
          
          const uniqueLabWorkstations = [...new Set(labWorkstationReports.map(w => w.workstation_id))].length;
          const labCompletionRate = labWorkstations > 0 
            ? (labReports / labWorkstations) * 100  // FIXED: Use total lab workstations
            : 0;
          
          return {
            lab_id: lab.lab_id,
            lab_name: lab.lab_name,
            totalWorkstations: labWorkstations,
            completedReports: labReports,
            uniqueWorkstationsWithMaintenance: uniqueLabWorkstations,
            completionRate: Math.round(labCompletionRate)
          };
        })
      );
    }
    
    // Get workstations that actually need maintenance this quarter
    // This is more accurate - not all workstations need quarterly maintenance
    const workstationsWithMaintenance = await prisma.pmc_reports.findMany({
      where: {
        ...whereClause,
        quarter: currentQuarter
      },
      select: {
        workstation_id: true
      }
    });
    
    const uniqueWorkstationIds = [...new Set(workstationsWithMaintenance.map(w => w.workstation_id))];
    const uniqueWorkstationsWithMaintenance = uniqueWorkstationIds.length;
    
    // Get lab names
    const labIds = labWiseData.map(lcd => lcd.lab_id);
    const labs = await prisma.laboratories.findMany({
      where: {
        lab_id: { in: labIds }
      },
      select: {
        lab_id: true,
        lab_name: true
      }
    });
    
    const labNameMap = labs.reduce((acc, lab) => {
      acc[lab.lab_id] = lab.lab_name;
      return acc;
    }, {} as Record<number, string>);
    
    // Transform data with ACCURATE completion rate
    // FIXED: Use total workstations as denominator, not just those with reports
    const completionRate = totalWorkstations > 0 
      ? (completedReports / totalWorkstations) * 100 
      : 0;
    
    const labCompletionData = labWiseData.map(lcd => ({
      lab_name: labNameMap[lcd.lab_id] || 'Unknown Lab',
      completed_reports: lcd._count.pmc_id,
      completion_rate: 0 // Will be calculated based on total workstations per lab
    }));
    
    res.json({
      totalWorkstations,
      completedReports,
      uniqueWorkstationsWithMaintenance,
      completionRate: Math.round(completionRate),
      currentQuarter,
      statusDistribution: statusDistribution.map(sd => ({
        status: sd.workstation_status,
        count: sd._count.pmc_id
      })),
      labCompletionData,
      perLabAnalytics // NEW: Detailed per-lab data for admin
    });
    
  } catch (error) {
    console.error("Error fetching maintenance analytics:", error);
    res.status(500).json({ message: "Failed to fetch maintenance analytics" });
  }
};

// Helper function to get current quarter
const getCurrentQuarter = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 1 && month <= 3) return "1st";
  if (month >= 4 && month <= 6) return "2nd";
  if (month >= 7 && month <= 9) return "3rd";
  return "4th";
};

// 🔄 SYNC: Use exact same statuses for maintenance and inventory
const syncInventoryStatusWithMaintenance = async (
  workstationId: number,
  maintenanceStatus: string,
  tx: any
) => {
  try {
    console.log("🔄 SYNCING STATUS:", { workstationId, maintenanceStatus });

    // Check what statuses are available in the database
    const allStatuses = await tx.asset_statuses.findMany({
      select: { status_id: true, status_name: true }
    });
    console.log("📋 AVAILABLE STATUSES:", allStatuses);

    // Use exact same statuses - no mapping needed
    const targetStatusName = maintenanceStatus; // Use status directly
    console.log("🎯 USING EXACT STATUS:", { from: maintenanceStatus, to: targetStatusName });

    // Find the status ID
    let statusRecord = await tx.asset_statuses.findFirst({
      where: { status_name: targetStatusName }
    });

    if (!statusRecord) {
      console.log("⚠️ STATUS NOT FOUND - CREATING:", targetStatusName);
      statusRecord = await tx.asset_statuses.create({
        data: {
          status_name: targetStatusName
        }
      });
      console.log("✅ STATUS CREATED:", {
        statusName: targetStatusName,
        statusId: statusRecord.status_id
      });
    } else {
      console.log("✅ STATUS FOUND:", {
        targetStatusName,
        statusId: statusRecord.status_id
      });
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

    console.log("📦 FOUND ASSETS:", {
      workstationId,
      assetCount: workstationAssets.length,
      assets: workstationAssets.map((a: any) => ({
        asset_id: a.asset_id,
        current_status: a.asset_details?.status_id
      }))
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

      console.log("✅ STATUS SYNCED:", {
        workstationId,
        assetsUpdated: workstationAssets.length,
        newStatusId: statusRecord.status_id,
        newStatusName: targetStatusName
      });
    } else {
      console.log("⚠️ No assets found for workstation:", workstationId);
    }

  } catch (error) {
    console.error("❌ STATUS SYNC ERROR:", error);
    // Don't throw - don't break the maintenance report creation
  }
};
