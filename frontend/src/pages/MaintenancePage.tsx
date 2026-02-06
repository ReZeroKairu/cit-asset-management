import React, { useState, useEffect } from "react";
import {
  getAllMaintenanceReports,
  deleteMaintenanceReport,
} from "../api/maintenance";

import type { MaintenanceReport } from "../api/maintenance";

// Import workstation helper
import { getLabWorkstationsForReport } from "../api/workstationReports";
// Import auth to get assigned lab
import { getUserAssignedLab } from "../api/dailyReports";

import MaintenanceForm from "../components/maintenance/MaintenanceForm";
// ✅ IMPORT NEW VIEW
import MaintenanceView from "../components/maintenance/MaintenanceView";
import { Plus, CheckCircle, XCircle, Filter, Monitor } from "lucide-react";

const MaintenancePage = () => {
  // ✅ UPDATED: Added "view" to state types
  const [view, setView] = useState<"list" | "view" | "create" | "edit">("list");

  // Data State
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [labWorkstations, setLabWorkstations] = useState<any[]>([]);

  const [selectedReport, setSelectedReport] = useState<
    MaintenanceReport | undefined
  >(undefined);

  const [targetWorkstation, setTargetWorkstation] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Filter State
  const [selectedQuarter, setSelectedQuarter] = useState<string>("1");
  const [userLabId, setUserLabId] = useState<number | null>(null);
  const [assignedLabName, setAssignedLabName] = useState<string>("");

  useEffect(() => {
    fetchUserLabInfo();
    fetchReports();
  }, []);

  const fetchUserLabInfo = async () => {
    try {
      const data = await getUserAssignedLab();
      if (data?.assigned_lab) {
        setUserLabId(data.assigned_lab.lab_id);
        setAssignedLabName(data.assigned_lab.lab_name);

        const wsData = await getLabWorkstationsForReport(
          data.assigned_lab.lab_id,
        );
        setLabWorkstations(wsData);
      }
    } catch (error) {
      console.error("Failed to load lab info", error);
    }
  };

  const fetchReports = async () => {
    try {
      const data = await getAllMaintenanceReports();
      setReports(data);
    } catch (err) {
      console.error("Failed to fetch maintenance reports", err);
    }
  };

  const isInSelectedQuarter = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const currentYear = new Date().getFullYear();

    if (year !== currentYear) return false;

    if (selectedQuarter === "1") return month >= 1 && month <= 3;
    if (selectedQuarter === "2") return month >= 4 && month <= 6;
    if (selectedQuarter === "3") return month >= 7 && month <= 9;
    if (selectedQuarter === "4") return month >= 10 && month <= 12;
    return false;
  };

  // Helper to find specific report for a workstation in current quarter
  const findReportForWorkstation = (workstationId: number) => {
    if (!userLabId) return undefined;
    return reports.find(
      (r) =>
        r.lab_id === userLabId &&
        isInSelectedQuarter(r.report_date) &&
        r.workstation_items?.some(
          (item) => item.workstation_id === workstationId,
        ),
    );
  };

  const getMaintenanceStatus = (workstationId: number) => {
    return !!findReportForWorkstation(workstationId);
  };

  const getStatusColor = (statusName?: string) => {
    switch (statusName) {
      case "Functional":
      case "Working":
      case "Operational":
        return "bg-green-100 text-green-800";
      case "For Repair":
        return "bg-yellow-100 text-yellow-800";
      case "For Replacement":
      case "Defective":
      case "Condemned":
        return "bg-red-100 text-red-800";
      case "For Upgrade":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // ✅ UPDATED: Clicking a row now opens "view" mode
  const handleWorkstationClick = (ws: any) => {
    setTargetWorkstation({ id: ws.workstation_id, name: ws.workstation_name });

    // Find if there is already a report for this workstation
    const existingReport = findReportForWorkstation(ws.workstation_id);
    setSelectedReport(existingReport);

    setView("view");
  };

  // ✅ NEW: Handle clicking "Service" button in View mode
  const handleServiceClick = () => {
    // We keep targetWorkstation and selectedReport as they are
    // Just switch view to create/edit form
    setView("create");
  };

  const sortedWorkstations = [...labWorkstations].sort((a, b) =>
    a.workstation_name.localeCompare(b.workstation_name, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Maintenance & Services
          </h1>
          <p className="text-gray-500">
            Quarterly Preventive Maintenance Checklist (QPMC)
          </p>
        </div>

        {view === "list" && (
          <button
            onClick={() => {
              setSelectedReport(undefined);
              setView("create");
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            New QPMC Report
          </button>
        )}
      </div>

      {view === "list" && (
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center">
              <Monitor className="w-5 h-5 text-gray-500 mr-2" />
              <h3 className="font-medium text-gray-900">
                {assignedLabName
                  ? `${assignedLabName} Workstations`
                  : "Workstation Status"}
              </h3>
            </div>

            <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-md border border-gray-300">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Quarter:</span>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="block pl-2 pr-8 py-1 text-sm border-none focus:ring-0 text-gray-700 font-medium"
              >
                <option value="1">1st Quarter (Jan-Mar)</option>
                <option value="2">2nd Quarter (Apr-Jun)</option>
                <option value="3">3rd Quarter (Jul-Sep)</option>
                <option value="4">4th Quarter (Oct-Dec)</option>
              </select>
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workstation Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workstation Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maintenance Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedWorkstations.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {userLabId
                      ? "No workstations found in your laboratory."
                      : "Loading laboratory data..."}
                  </td>
                </tr>
              ) : (
                sortedWorkstations.map((ws) => {
                  const isServiced = getMaintenanceStatus(ws.workstation_id);

                  return (
                    <tr
                      key={ws.workstation_id}
                      onClick={() => handleWorkstationClick(ws)}
                      className="hover:bg-blue-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 group-hover:text-blue-700">
                        {ws.workstation_name}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ws.workstation_remarks || "-"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            ws.current_status?.status_name,
                          )}`}
                        >
                          {ws.current_status?.status_name || "Unknown"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isServiced ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                            Serviced
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="w-4 h-4 mr-1.5" />
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
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500">
            Showing status for {sortedWorkstations.length} workstations in
            Quarter {selectedQuarter} of {new Date().getFullYear()}
          </div>
        </div>
      )}

      {/* ✅ NEW VIEW MODE */}
      {view === "view" && targetWorkstation && (
        <MaintenanceView
          workstation={{
            id: targetWorkstation.id,
            name: targetWorkstation.name,
            lab_name: assignedLabName,
          }}
          reportSummary={selectedReport}
          quarter={
            selectedQuarter === "1"
              ? "1st"
              : selectedQuarter === "2"
                ? "2nd"
                : selectedQuarter === "3"
                  ? "3rd"
                  : "4th"
          }
          onService={handleServiceClick}
          onBack={() => setView("list")}
        />
      )}

      {/* CREATE/EDIT FORM */}
      {(view === "create" || view === "edit") && (
        <MaintenanceForm
          report={selectedReport}
          targetWorkstation={targetWorkstation}
          onSuccess={() => {
            setView("list");
            fetchReports();
            fetchUserLabInfo();
          }}
          onCancel={() => setView("list")}
        />
      )}
    </div>
  );
};

export default MaintenancePage;
