import { useState, useEffect } from "react";
import { getLabPMCReports, type PMCReport } from "../api/maintenance";
import QuarterlyReportsView from "../components/maintenance/QuarterlyReportsView";
import SetScheduleModal from "../components/maintenance/SetScheduleModal";
import { calculateWorstStatus } from "../utils/statusUtils";

// Import workstation helper
import { getLabWorkstationsForReport } from "../api/workstationReports";
// Import auth to get assigned lab
import { getUserAssignedLab } from "../api/dailyReports";
// Import assets API
import { getWorkstationAssets } from "../api/inventory";
// ✅ IMPORT useAuth to get user role and lab_id
import { useAuth } from "../context/AuthContext";

import MaintenanceForm from "../components/maintenance/MaintenanceForm";
import MaintenanceView from "../components/maintenance/MaintenanceView";
import {
  Monitor,
  Plus,
  FileText,
  Lock,
  RotateCcw,
  ChevronDown,
} from "lucide-react";

const MaintenancePage = () => {
  // ✅ Get the user from AuthContext
  const { user } = useAuth();

  const [view, setView] = useState<
    "list" | "view" | "create" | "edit" | "reports"
  >("list");

  // Data State
  const [reports, setReports] = useState<PMCReport[]>([]);
  const [labWorkstations, setLabWorkstations] = useState<any[]>([]);
  const [workstationAssets, setWorkstationAssets] = useState<Record<number, any[]>>({});

  const [targetWorkstation, setTargetWorkstation] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Filter State
  const [selectedQuarter, setSelectedQuarter] = useState<string>("1st");
  const [userLabId, setUserLabId] = useState<number | null>(null);
  const [assignedLabName, setAssignedLabName] = useState<string>("");

  // Schedule state
  const [openQuarters, setOpenQuarters] = useState<string[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScheduleDropdown, setShowScheduleDropdown] = useState(false);

  // UI-only state for toggles
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(Date.now());

  // List of Quarters for the new UI Tabs
  const quartersList = [
    { id: "1st", num: "Q1", label: "1st Quarter" },
    { id: "2nd", num: "Q2", label: "2nd Quarter" },
    { id: "3rd", num: "Q3", label: "3rd Quarter" },
    { id: "4th", num: "Q4", label: "4th Quarter" },
  ];

  // Mock fetch for schedules (Later, replace with actual API call)
  useEffect(() => {
    if (userLabId) {
      // Pretend the 1st Quarter is already open in the database for now
      setOpenQuarters(["1st"]);
    }
  }, [userLabId]);

  const handleScheduleSuccess = (newlyScheduledQuarters: string[]) => {
    setOpenQuarters((prev) => {
      const combined = new Set([...prev, ...newlyScheduledQuarters]);
      return Array.from(combined);
    });
    setShowScheduleModal(false);
  };

  const handleResetAllSchedules = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all quarter schedules? This will remove all scheduled quarters.",
      )
    ) {
      setOpenQuarters([]);
      setSelectedQuarter("1st"); // Reset to default quarter
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedQuarter]);

  const fetchData = async () => {
    try {
      const userData = await getUserAssignedLab();
      if (!userData?.assigned_lab) return;

      const labId = userData.assigned_lab.lab_id;
      setUserLabId(labId);
      setAssignedLabName(userData.assigned_lab.lab_name);

      const wsData = await getLabWorkstationsForReport(labId);
      setLabWorkstations(wsData);

      // Load assets for each workstation to calculate actual status
      const assetsData: Record<number, any[]> = {};
      for (const ws of wsData) {
        try {
          const assets = await getWorkstationAssets(ws.workstation_id);
          // Transform assets to have status property
          const transformedAssets = assets.map((asset: any) => ({
            ...asset,
            status: asset.details?.current_status?.status_name || asset.status || 'Functional'
          }));
          assetsData[ws.workstation_id] = transformedAssets;
        } catch (error) {
          console.error(`Failed to load assets for workstation ${ws.workstation_id}:`, error);
          assetsData[ws.workstation_id] = [];
        }
      }
      setWorkstationAssets(assetsData);

      const reportsData = await getLabPMCReports(labId, selectedQuarter);
      setReports(reportsData);
    } catch (error) {
      console.error("Failed to load maintenance data", error);
    }
  };

  const findReportForWorkstation = (workstationId: number) => {
    return reports.find((r) => r.workstation_id === workstationId);
  };

  const getStatusColor = (statusName?: string) => {
    switch (statusName) {
      case "Functional":
      case "Working":
      case "Operational":
        return "bg-green-100 text-green-800";
      case "For Repair":
        return "bg-amber-100 text-amber-800";
      case "For Replacement":
        return "bg-red-100 text-red-800";
      case "For Upgrade":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleWorkstationClick = (ws: any) => {
    setTargetWorkstation({ id: ws.workstation_id, name: ws.workstation_name });
    setView("view");
  };

  const handleServiceClick = () => {
    setView("create");
  };

  const handleReturnToView = () => {
    setRefreshTrigger(Date.now()); // Trigger refresh
    setView("view");
  };

  const sortedWorkstations = [...labWorkstations].sort((a, b) =>
    a.workstation_name.localeCompare(b.workstation_name, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Maintenance & Services
        </h1>
        <p className="text-gray-600">
          Quarterly Preventive Maintenance Checklist (QPMC)
        </p>

        {/* ✅ Lab Assigned Indicator for Custodians */}
        {user?.role === "Custodian" && user?.lab_id && (
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            📍 Assigned Lab: {assignedLabName || "Loading..."}
          </div>
        )}
      </div>

      {view === "list" && (
        <div className="space-y-4">
          {/* Top Filter Toggle & Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Left Side: Toggles */}
              <div className="flex items-center space-x-3 bg-gray-50 p-1 rounded-lg border border-gray-200">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                    activeTab === "all"
                      ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All Workstations
                </button>
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                    activeTab === "pending"
                      ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Other Assets
                </button>
              </div>

              {/* Right Side: Action Controls */}
              <div className="flex items-center space-x-3">
                {/* Schedule Dropdown */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setShowScheduleDropdown(!showScheduleDropdown)
                    }
                    className="h-10 px-4 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 flex items-center font-medium shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2 text-blue-600" /> Set Schedule
                    <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
                  </button>

                  {showScheduleDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <button
                        onClick={() => {
                          setShowScheduleDropdown(false);
                          setShowScheduleModal(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center rounded-t-lg"
                      >
                        <Plus className="w-4 h-4 mr-2 text-blue-600" /> Set New
                        Schedule
                      </button>
                      {openQuarters.length > 0 && (
                        <button
                          onClick={() => {
                            setShowScheduleDropdown(false);
                            handleResetAllSchedules();
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center rounded-b-lg border-t border-gray-100"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" /> Reset All
                          Schedules
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setView("reports")}
                  className="h-10 px-4 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center font-medium shadow-sm transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" /> View Reports
                </button>
              </div>
            </div>
          </div>

          {/* Attached Tabs and Table Wrapper */}
          <div>
            {/* Quarter Tabs matching the attached design */}
            <div className="flex gap-2 items-end h-21.25">
              {quartersList.map((q) => {
                const isActive = selectedQuarter === q.id;
                const isOpen = openQuarters.includes(q.id);

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      if (isOpen) setSelectedQuarter(q.id);
                    }}
                    disabled={!isOpen}
                    className={`relative flex flex-col items-start justify-center w-36 transition-all ${
                      !isOpen
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed rounded-xl px-5 py-3 mb-2 border border-gray-200"
                        : isActive
                          ? "bg-white text-blue-600 rounded-t-2xl z-10 border-t border-x border-gray-100 px-6 py-4 -mb-px shadow-[0_-4px_10px_rgba(0,0,0,0.02)]"
                          : "bg-blue-500 text-white hover:bg-blue-600 rounded-xl px-5 py-3 mb-2 shadow-sm"
                    }`}
                  >
                    {isActive && isOpen && (
                      <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-600 rounded-r-md"></div>
                    )}

                    <div
                      className={`w-full flex justify-between items-center ${isActive ? "pl-1" : ""}`}
                    >
                      <div>
                        <span className="text-2xl font-bold leading-none block text-left mb-1">
                          {q.num}
                        </span>
                        <span
                          className={`text-xs font-medium tracking-wide block text-left ${
                            !isOpen
                              ? "text-gray-400"
                              : isActive
                                ? "text-gray-500"
                                : "text-blue-100"
                          }`}
                        >
                          {q.label}
                        </span>
                      </div>

                      {!isOpen && (
                        <Lock className="w-4 h-4 text-gray-400 opacity-70" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Main Table Content */}
            <div className="bg-white shadow-sm rounded-xl rounded-tl-none overflow-hidden border border-gray-100 relative z-0">
              <div className="p-5 border-b border-gray-100 bg-white flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                    <Monitor className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {assignedLabName
                      ? `${assignedLabName} Workstations`
                      : "Workstation Status"}
                  </h3>
                </div>
              </div>

              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Workstation Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Workstation Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {selectedQuarter} Quarter Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {sortedWorkstations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        {userLabId
                          ? "No workstations found in your laboratory."
                          : "Loading laboratory data..."}
                      </td>
                    </tr>
                  ) : (
                    sortedWorkstations.map((ws) => {
                      const isServiced = !!findReportForWorkstation(
                        ws.workstation_id,
                      );

                      // Calculate actual workstation status from components
                      const assets = workstationAssets[ws.workstation_id] || [];
                      const calculatedStatus = assets.length > 0 ? calculateWorstStatus(assets) : 'Functional';

                      return (
                        <tr
                          key={ws.workstation_id}
                          onClick={() => handleWorkstationClick(ws)}
                          className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 group-hover:text-blue-700">
                            {ws.workstation_name}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2.5 py-1 text-xs font-medium rounded-md ${getStatusColor(
                                calculatedStatus,
                              )}`}
                            >
                              {calculatedStatus}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {isServiced ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                Serviced
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="bg-white px-6 py-4 border-t border-gray-100 text-xs text-gray-400">
                Showing status for{" "}
                <span className="font-medium text-gray-600">
                  {sortedWorkstations.length}
                </span>{" "}
                workstations in {selectedQuarter} Quarter
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE */}
      {view === "view" && targetWorkstation && (
        <MaintenanceView
          workstation={{
            id: targetWorkstation.id,
            name: targetWorkstation.name,
            lab_name: assignedLabName,
          }}
          quarter={selectedQuarter}
          onService={handleServiceClick}
          onBack={() => setView("list")}
          refreshTrigger={refreshTrigger}
        />
      )}

      {/* CREATE/EDIT FORM */}
      {(view === "create" || view === "edit") && (
        <MaintenanceForm
          targetWorkstation={targetWorkstation}
          onSuccess={() => {
            fetchData(); // Refresh main data
            handleReturnToView(); // Return to view with refresh trigger
          }}
          onCancel={() => setView("list")}
        />
      )}

      {/* REPORTS VIEW */}
      {view === "reports" && (
        <QuarterlyReportsView
          labId={userLabId}
          labName={assignedLabName}
          labWorkstations={labWorkstations}
          onBack={() => setView("list")}
        />
      )}

      {/* SET SCHEDULE MODAL */}
      {showScheduleModal && (
        <SetScheduleModal
          labId={userLabId}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={handleScheduleSuccess}
        />
      )}
    </div>
  );
};

export default MaintenancePage;
