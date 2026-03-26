import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ScheduleService {
  // GET all schedules for a lab and fiscal year
  static async getLabSchedules(lab_id: number, fiscal_year: string) {
    const schedules = await prisma.maintenance_schedules.findMany({
      where: {
        lab_id,
        fiscal_year,
      },
      orderBy: [
        { quarter: "asc" }
      ],
    });

    // Transform to the format expected by frontend
    const formattedSchedules = schedules.reduce((acc, schedule) => {
      acc[schedule.quarter] = {
        start: schedule.start_date.toISOString().split('T')[0],
        end: schedule.end_date.toISOString().split('T')[0],
        servicingWeeks: Array.isArray(schedule.servicing_weeks) 
          ? schedule.servicing_weeks 
          : JSON.parse(schedule.servicing_weeks as string || '[]'),
      };
      return acc;
    }, {} as Record<string, any>);

    return formattedSchedules;
  }

  // CREATE or UPDATE schedules for a lab
  static async upsertSchedules(
    lab_id: number, 
    fiscal_year: string, 
    schedules: Record<string, any>
  ) {
    const result = await prisma.$transaction(async (tx) => {
      const createdQuarters: string[] = [];

      for (const [quarter, scheduleData] of Object.entries(schedules)) {
        const { start, end, servicingWeeks } = scheduleData as any;

        // Only process if there's actual schedule data
        if (start && end && servicingWeeks && servicingWeeks.length > 0) {
          const existingSchedule = await tx.maintenance_schedules.findFirst({
            where: {
              lab_id,
              fiscal_year,
              quarter: String(quarter),
            },
          });

          if (existingSchedule) {
            // Update existing schedule
            await tx.maintenance_schedules.update({
              where: { schedule_id: existingSchedule.schedule_id },
              data: {
                start_date: new Date(start),
                end_date: new Date(end),
                servicing_weeks: servicingWeeks,
                updated_at: new Date(),
              },
            });
          } else {
            // Create new schedule
            await tx.maintenance_schedules.create({
              data: {
                lab_id,
                quarter: String(quarter),
                fiscal_year,
                start_date: new Date(start),
                end_date: new Date(end),
                servicing_weeks: servicingWeeks,
              },
            });
          }

          createdQuarters.push(quarter);
        }
      }

      return createdQuarters;
    });

    return {
      message: "Schedules saved successfully",
      scheduledQuarters: result,
    };
  }

  // DELETE all schedules for a lab and fiscal year
  static async deleteLabSchedules(lab_id: number, fiscal_year: string) {
    const result = await prisma.maintenance_schedules.deleteMany({
      where: {
        lab_id,
        fiscal_year,
      },
    });

    return {
      message: "Schedules deleted successfully",
      deletedCount: result.count,
    };
  }
}
