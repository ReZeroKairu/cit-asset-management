import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardCard from "../ui/DashboardCard";
import InventoryAnalyticsSection from "../admin/InventoryAnalyticsSection";
import CustodianInventoryAnalyticsSection from "../admin/CustodianInventoryAnalyticsSection";
import AuditSection from "../audit/AuditSection";
import {
  Package,
  Building,
  FileText,
  Wrench,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import { getDashboardStats, type DashboardData } from "../../api/dashboard";
import { getLabSchedules } from "../../api/schedule";
import { getUserAssignedLab } from "../../api/dailyReports";

interface HomePageProps {
  onNavigate: (page: string) => void;
}

// Helper function to calculate service week dates
const getServiceWeekDates = (servicingWeeks: number[], quarterStartDate: string): string => {
  if (!servicingWeeks || servicingWeeks.length === 0) {
    return 'Not set';
  }
  
  const quarterStart = new Date(quarterStartDate);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const weekDates = servicingWeeks.map(weekNumber => {
    // Calculate the start date of the given week
    const weekStart = new Date(quarterStart);
    weekStart.setDate(quarterStart.getDate() + (weekNumber - 1) * 7);
    
    // Calculate the end date of the week (6 days after start)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Format as "Mon D - Mon D"
    return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}`;
  });
  
  return weekDates.join(', ');
};

const HomePage = ({ onNavigate }: HomePageProps) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingSchedule, setUpcomingSchedule] = useState<{
    quarter: string;
    startDate: string;
    endDate: string;
    daysUntil: number;
    servicingWeeks: number[];
  } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getDashboardStats();
        setDashboardData(data);
        
        // Fetch upcoming maintenance schedule for custodians
        if (user?.role === "Custodian") {
          await fetchUpcomingSchedule();
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.role]);

  const fetchUpcomingSchedule = async () => {
    try {
      const userData = await getUserAssignedLab();
      if (!userData?.assigned_lab) return;

      const labId = userData.assigned_lab.lab_id;
      const currentFiscalYear = "2025-2026"; // Could be made dynamic
      const schedules = await getLabSchedules(labId, currentFiscalYear);
      
      const today = new Date();
      let nextSchedule: { quarter: string; startDate: string; endDate: string; daysUntil: number; servicingWeeks: number[] } | null = null;
      
      // Find the next upcoming quarter
      for (const [quarter, dates] of Object.entries(schedules)) {
        const startDate = new Date(dates.start);
        const endDate = new Date(dates.end);
        
        // If quarter hasn't started yet, calculate days until
        if (today < startDate) {
          const daysUntil = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (!nextSchedule || daysUntil < nextSchedule.daysUntil) {
            nextSchedule = {
              quarter,
              startDate: dates.start,
              endDate: dates.end,
              daysUntil,
              servicingWeeks: dates.servicingWeeks || []
            };
          }
        }
        else if (today >= startDate && today <= endDate) {
          nextSchedule = {
            quarter,
            startDate: dates.start,
            endDate: dates.end,
            daysUntil: 0, // Currently active
            servicingWeeks: dates.servicingWeeks || []
          };
          break; // Found current quarter, no need to check further
        }
      }
      
      setUpcomingSchedule(nextSchedule);
    } catch (error) {
      console.error("Failed to fetch upcoming schedule:", error);
    }
  };

  const handleNavigate = (page: string) => {
    if (page === "user-management" && user?.role !== "Admin") {
      console.log("Access denied: Admin only");
      return;
    }
    onNavigate(page);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const { stats, userAssignedLab, userRole } = dashboardData;
  const isAdmin = userRole === "Admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome to CIT Asset Management
        </h1>
        <p className="text-gray-600">
          {userRole === "Custodian" && userAssignedLab
            ? `Manage your laboratory assets and daily reports efficiently for ${userAssignedLab.lab_name}`
            : userRole === "Admin"
            ? "Manage reports efficiently"
            : "Manage your laboratory assets and daily reports efficiently"}
        </p>
      </div>

      {/* Stats Cards */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${
          !isAdmin ? "lg:grid-cols-3" : ""
        }`}
      >
        <DashboardCard
          title="Total Assets"
          value={stats.totalAssets}
          subtitle={`(${(stats.servicedWorkstations || 0) + (stats.unservicedWorkstations || 0)} Workstations)`}
          icon={Package}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          subtitleColor="text-blue-600"
          onClick={() => handleNavigate("inventory")}
        />

        {userRole === "Custodian" && (
          <DashboardCard
            title="Maintenance Schedule"
            value={upcomingSchedule ? `${upcomingSchedule.quarter} Quarter` : "No Schedule"}
            subtitle={upcomingSchedule 
              ? upcomingSchedule.daysUntil === 0 
                ? `Service${upcomingSchedule.servicingWeeks && upcomingSchedule.servicingWeeks.length > 0 ? '\nDays: ' + getServiceWeekDates(upcomingSchedule.servicingWeeks, upcomingSchedule.startDate) : ''}` 
                : `${new Date(upcomingSchedule.startDate).toLocaleDateString()} - ${new Date(upcomingSchedule.endDate).toLocaleDateString()} • Starts in ${upcomingSchedule.daysUntil} days →${upcomingSchedule.servicingWeeks && upcomingSchedule.servicingWeeks.length > 0 ? '\nService: ' + getServiceWeekDates(upcomingSchedule.servicingWeeks, upcomingSchedule.startDate) : ''}`
              : "Set maintenance schedule →"
            }
            icon={Wrench}
            iconBgColor="bg-indigo-100"
            iconColor="text-indigo-600"
            subtitleColor="text-indigo-600"
            onClick={() => handleNavigate("maintenance")}
          />
        )}

        <DashboardCard
          title="Daily Reports"
          value={stats.totalDailyReports}
          subtitle="Click to view reports →"
          icon={FileText}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          subtitleColor="text-purple-600"
          onClick={() => handleNavigate(isAdmin ? "admin-reports" : "reports")}
        />

        <DashboardCard
          title={isAdmin ? "Forms for Approval" : "Active Forms"}
          value={stats.totalForms}
          subtitle="Click to view forms →"
          icon={ClipboardList}
          iconBgColor="bg-indigo-100"
          iconColor="text-indigo-600"
          subtitleColor="text-indigo-600"
          onClick={() => handleNavigate("forms")}
        />

        {isAdmin && (
          <DashboardCard
            title="Laboratories"
            value={stats.totalLaboratories}
            subtitle="Click to view labs →"
            icon={Building}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            subtitleColor="text-green-600"
            onClick={() => handleNavigate("labs")}
          />
        )}

        {userRole === "Custodian" && (
          <DashboardCard
            title="Active Complaints"
            value={stats.totalComplaints || 0}
            subtitle={`${stats.openComplaints || 0} Open • ${stats.inProgressComplaints || 0} In Progress`}
            icon={MessageSquare}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
            subtitleColor="text-orange-600"
            onClick={() => handleNavigate("complaints-management")}
          />
        )}
      </div>

      {/* Inventory Analytics Section - Role Based */}
      {userRole === "Admin" ? (
        <InventoryAnalyticsSection />
      ) : userRole === "Custodian" ? (
        <CustodianInventoryAnalyticsSection />
      ) : null}

      {/* Audit Section - Admin Only */}
      {isAdmin && (
        <AuditSection />
      )}
    </div>
  );
};

export default HomePage;
