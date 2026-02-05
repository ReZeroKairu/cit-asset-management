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
import { Plus, CheckCircle, XCircle, Filter, Monitor } from "lucide-react";

const MaintenancePage = () => {
  // 'list' now refers to the Workstation List, not Report List
  const [view, setView] = useState<"list" | "create" | "edit">("list");

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
  const [selectedQuarter, setSelectedQuarter] = useState<string>("1"); // 1, 2, 3, 4
  const [userLabId, setUserLabId] = useState<number | null>(null);
  const [assignedLabName, setAssignedLabName] = useState<string>("");

  useEffect(() => {
    fetchUserLabInfo();
    fetchReports(); // Still need reports to calculate status!
  }, []);

  // 1. Fetch User's Lab & Workstations
  const fetchUserLabInfo = async () => {
    try {
      const data = await getUserAssignedLab();
      if (data?.assigned_lab) {
        setUserLabId(data.assigned_lab.lab_id);
        setAssignedLabName(data.assigned_lab.lab_name);

        // Fetch ALL workstations for this lab
        const wsData = await getLabWorkstationsForReport(
          data.assigned_lab.lab_id,
        );
        setLabWorkstations(wsData);
      }
    } catch (error) {
      console.error("Failed to load lab info", error);
    }
  };

  // 2. Fetch Reports (Used for Status Calculation)
  const fetchReports = async () => {
    try {
      const data = await getAllMaintenanceReports();
      setReports(data);
    } catch (err) {
      console.error("Failed to fetch maintenance reports", err);
    }
  };

  // Helper: Check if a date is in the selected quarter
  const isInSelectedQuarter = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();
    const currentYear = new Date().getFullYear();

    if (year !== currentYear) return false;

    if (selectedQuarter === "1") return month >= 1 && month <= 3;
    if (selectedQuarter === "2") return month >= 4 && month <= 6;
    if (selectedQuarter === "3") return month >= 7 && month <= 9;
    if (selectedQuarter === "4") return month >= 10 && month <= 12;
    return false;
  };

  // Logic: Determine Red/Green status
  const getWorkstationStatus = (workstationId: number) => {
    if (!userLabId) return false;

    // Filter reports for this lab AND selected quarter
    const relevantReports = reports.filter(
      (r) => r.lab_id === userLabId && isInSelectedQuarter(r.report_date),
    );

    // Check if workstation ID exists in any of those reports
    return relevantReports.some((report) =>
      report.workstation_items?.some(
        (item) => item.workstation_id === workstationId,
      ),
    );
  };

  const handleWorkstationClick = (ws: any) => {
    setTargetWorkstation({ id: ws.workstation_id, name: ws.workstation_name });
    setSelectedReport(undefined); // Ensure we aren't in "Edit Mode" of an old report
    setView("create");
  };

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

      {/* VIEW: Workstation Status Table (Default) */}
      {view === "list" && (
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
          {/* Table Header / Filter Toolbar */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center">
              <Monitor className="w-5 h-5 text-gray-500 mr-2" />
              <h3 className="font-medium text-gray-900">
                {assignedLabName
                  ? `${assignedLabName} Workstations`
                  : "Workstation Status"}
              </h3>
            </div>

            {/* Quarter Filter */}
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
                  Maintenance Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {labWorkstations.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {userLabId
                      ? "No workstations found in your laboratory."
                      : "Loading laboratory data..."}
                  </td>
                </tr>
              ) : (
                labWorkstations.map((ws) => {
                  const isChecked = getWorkstationStatus(ws.workstation_id);
                  return (
                    <tr
                      onClick={() => handleWorkstationClick(ws)}
                      className="hover:bg-blue-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ws.workstation_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isChecked ? (
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
            Showing status for {labWorkstations.length} workstations in Quarter{" "}
            {selectedQuarter} of {new Date().getFullYear()}
          </div>
        </div>
      )}

      {/* VIEW: Create/Edit Form */}
      {(view === "create" || view === "edit") && (
        <MaintenanceForm
          report={selectedReport}
          targetWorkstation={targetWorkstation}
          onSuccess={() => {
            setView("list");
            fetchReports(); // Refresh data after submit
          }}
          onCancel={() => setView("list")}
        />
      )}
    </div>
  );
};

export default MaintenancePage;
