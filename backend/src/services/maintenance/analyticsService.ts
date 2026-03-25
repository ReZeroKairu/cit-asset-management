import { PrismaClient } from "@prisma/client";
import { ScheduleService } from "./scheduleService";

const prisma = new PrismaClient();

export class AnalyticsService {
  // Helper function to get current quarter based on maintenance schedules
  static async getCurrentQuarterBasedOnSchedules(labId?: number) {
    const currentFiscalYear = "2025-2026";
    
    try {
      // If labId provided, get lab-specific schedules
      if (labId) {
        const schedules = await ScheduleService.getLabSchedules(labId, currentFiscalYear);
        
        if (Object.keys(schedules).length > 0) {
          const today = new Date();
          
          // Find which quarter contains today's date
          for (const [quarter, dates] of Object.entries(schedules)) {
            const startDate = new Date((dates as any).start);
            const endDate = new Date((dates as any).end);

            if (today >= startDate && today <= endDate) {
              return quarter;
            }
          }
          
          // If no active quarter, find next upcoming
          const upcomingQuarters = Object.entries(schedules)
            .filter(([, dates]) => {
              const startDate = new Date((dates as any).start);
              return startDate > today;
            })
            .sort(([, a], [, b]) => {
              const dateA = new Date((a as any).start);
              const dateB = new Date((b as any).start);
              return dateA.getTime() - dateB.getTime();
            });

          if (upcomingQuarters.length > 0) {
            return upcomingQuarters[0][0];
          }
        }
      }
    } catch (error) {
      console.error("Failed to get schedules for quarter detection:", error);
    }
    
    // Fallback to calendar-based quarter detection
    const month = new Date().getMonth() + 1;
    if (month >= 1 && month <= 3) return "1st";
    if (month >= 4 && month <= 6) return "2nd";
    if (month >= 7 && month <= 9) return "3rd";
    return "4th";
  }

  // Helper function to get all quarters for history
  static async getAllQuarters(labId?: number) {
    const currentFiscalYear = "2025-2026";
    
    try {
      if (labId) {
        const schedules = await ScheduleService.getLabSchedules(labId, currentFiscalYear);
        return Object.keys(schedules);
      }
    } catch (error) {
      console.error("Failed to get quarters for history:", error);
    }
    
    // Fallback to standard quarters
    return ["1st", "2nd", "3rd", "4th"];
  }

  // GET Preventive Maintenance Analytics for Dashboard
  static async getMaintenanceAnalytics(userId?: number, userRole?: string) {
    let whereClause = {};
    let currentQuarter = "1st"; // default
    let allQuarters = ["1st", "2nd", "3rd", "4th"]; // default
    
    // For custodians, only get analytics from their assigned lab and get their quarter
    if (userRole === "Custodian" && userId) {
      const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: { lab_id: true }
      });
      
      if (user?.lab_id) {
        whereClause = { lab_id: user.lab_id };
        currentQuarter = await this.getCurrentQuarterBasedOnSchedules(user.lab_id);
        allQuarters = await this.getAllQuarters(user.lab_id);
      }
    } else if (userRole === "Admin") {
      // For admin, use the first lab's schedule to determine current quarter
      const firstLab = await prisma.laboratories.findFirst({
        select: { lab_id: true }
      });
      
      if (firstLab) {
        currentQuarter = await this.getCurrentQuarterBasedOnSchedules(firstLab.lab_id);
        allQuarters = await this.getAllQuarters(firstLab.lab_id);
      }
    }
    
    // Get total workstations count
    const totalWorkstations = await prisma.workstations.count({
      where: whereClause
    });
    
    // Get completed PMC reports (current quarter)
    const completedReports = await prisma.pmc_reports.count({
      where: {
        ...whereClause,
        quarter: currentQuarter
      }
    });
    
    // Get historical data for previous quarters
    const historicalData = [];
    for (const quarter of allQuarters) {
      if (quarter !== currentQuarter) {
        const quarterReports = await prisma.pmc_reports.count({
          where: {
            ...whereClause,
            quarter: quarter
          }
        });
        
        historicalData.push({
          quarter,
          completedReports: quarterReports,
          completionRate: totalWorkstations > 0 ? (quarterReports / totalWorkstations) * 100 : 0
        });
      }
    }
    
    // Sort historical data by quarter (most recent first)
    historicalData.sort((a, b) => {
      const quarterOrder = ["1st", "2nd", "3rd", "4th"];
      return quarterOrder.indexOf(a.quarter) - quarterOrder.indexOf(b.quarter);
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
          
          const labCompletionRate = labWorkstations > 0 
            ? (labReports / labWorkstations) * 100  // FIXED: Use total lab workstations
            : 0;
          
          return {
            lab_id: lab.lab_id,
            lab_name: lab.lab_name,
            totalWorkstations: labWorkstations,
            completedReports: labReports,
            completionRate: Math.round(labCompletionRate)
          };
        })
      );
    }
    
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
    
    return {
      totalWorkstations,
      completedReports,
      completionRate: Math.round(completionRate),
      currentQuarter,
      labCompletionData,
      perLabAnalytics, // NEW: Detailed per-lab data for admin
      historicalData // NEW: Historical data for previous quarters
    };
  }
}
