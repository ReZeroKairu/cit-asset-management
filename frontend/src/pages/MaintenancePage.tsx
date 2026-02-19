import { useState, useEffect } from "react";
import { getLabPMCReports, type PMCReport } from "../api/maintenance";

// Import workstation helper
import { getLabWorkstationsForReport } from "../api/workstationReports";
// Import auth to get assigned lab
import { getUserAssignedLab } from "../api/dailyReports";

import MaintenanceForm from "../components/maintenance/MaintenanceForm";
import MaintenanceView from "../components/maintenance/MaintenanceView";
import { CheckCircle, XCircle, Filter, Monitor } from "lucide-react";

const MaintenancePage = () => {
  const [view, setView] = useState<"list" | "view" | "create" | "edit">("list");

  // Data State
  const [reports, setReports] = useState<PMCReport[]>([]);
  const [labWorkstations, setLabWorkstations] = useState<any[]>([]);

  const [targetWorkstation, setTargetWorkstation] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Filter State
  const [selectedQuarter, setSelectedQuarter] = useState<string>("1st");
  const [userLabId, setUserLabId] = useState<number | null>(null);
  const [assignedLabName, setAssignedLabName] = useState<string>("");

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

      // ✅ Fetch the new PMC reports
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

  const handleWorkstationClick = (ws: any) => {
    setTargetWorkstation({ id: ws.workstation_id, name: ws.workstation_name });
    setView("view");
  };

  const handleServiceClick = () => {
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
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-white px-3 py-2 rounded-md border border-gray-300 shadow-sm">
              <Filter className="w-4 h-4 text-gray-500 mr-2" />
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="text-sm border-none focus:ring-0 text-gray-700 font-medium outline-none"
              >
                <option value="1st">1st Quarter</option>
                <option value="2nd">2nd Quarter</option>
                <option value="3rd">3rd Quarter</option>
                <option value="4th">4th Quarter</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {view === "list" && (
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
            <Monitor className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="font-medium text-gray-900">
              {assignedLabName
                ? `${assignedLabName} Workstations`
                : "Workstation Status"}
            </h3>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workstation Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedQuarter} Quarter Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedWorkstations.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500"
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

                  return (
                    <tr
                      key={ws.workstation_id}
                      onClick={() => handleWorkstationClick(ws)}
                      className="hover:bg-blue-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 group-hover:text-blue-700">
                        {ws.workstation_name}
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
            Showing status for {sortedWorkstations.length} workstations in{" "}
            {selectedQuarter} Quarter
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
          // ❌ REMOVED: reportSummary={selectedReport as any}
        />
      )}

      {/* CREATE/EDIT FORM */}
      {(view === "create" || view === "edit") && (
        <MaintenanceForm
          targetWorkstation={targetWorkstation}
          onSuccess={() => {
            setView("list");
            fetchData();
          }}
          onCancel={() => setView("list")}
        />
      )}
    </div>
  );
};

export default MaintenancePage;
