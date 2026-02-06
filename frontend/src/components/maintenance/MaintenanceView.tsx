import React, { useState, useEffect } from "react";
import { getMaintenanceReportById } from "../../api/maintenance";
import type { MaintenanceReport } from "../../api/maintenance";
import { getWorkstationAssets } from "../../api/inventory";
import {
  Monitor,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Wrench,
} from "lucide-react";

interface Props {
  workstation: { id: number; name: string; lab_name?: string };
  reportSummary?: MaintenanceReport; // The summary we have from the list
  quarter: string; // The selected quarter from the parent
  onService: () => void;
  onBack: () => void;
}

const MaintenanceView: React.FC<Props> = ({
  workstation,
  reportSummary,
  quarter,
  onService,
  onBack,
}) => {
  const [fullReport, setFullReport] = useState<MaintenanceReport | null>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [workstation.id, reportSummary]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Assets (Always needed)
      const assetData = await getWorkstationAssets(workstation.id);
      setAssets(assetData);

      // 2. Fetch Full Report Procedures (If a report exists)
      if (reportSummary?.report_id) {
        const reportData = await getMaintenanceReportById(
          reportSummary.report_id,
        );
        setFullReport(reportData);
      }
    } catch (error) {
      console.error("Failed to load details", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Find specific remarks/status for this workstation from the report items
  const wsItem = fullReport?.workstation_items?.find(
    (item) => item.workstation_id === workstation.id,
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Monitor className="w-6 h-6 mr-2 text-blue-600" />
            {workstation.name}
          </h2>
          <p className="text-gray-500 mt-1">
            {workstation.lab_name || "Laboratory Workstation"}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to List
          </button>
          {/* ✅ SERVICE BUTTON */}
          <button
            onClick={onService}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center shadow-sm"
          >
            <Wrench className="w-4 h-4 mr-2" />
            Service Workstation
          </button>
        </div>
      </div>

      {/* Status Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Maintenance Period
          </h3>
          <p className="text-lg font-semibold text-gray-900">
            {quarter} Quarter
          </p>
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-1.5" />
            {fullReport
              ? formatDate(fullReport.report_date)
              : "Not yet serviced"}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Workstation Status
          </h3>
          {fullReport ? (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                wsItem?.status === "Pending"
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {wsItem?.status || "Functional"}
            </span>
          ) : (
            <span className="text-gray-500 italic">Pending Maintenance</span>
          )}
          <p className="text-sm text-gray-600 mt-2">
            Remarks: {wsItem?.remarks || "No remarks recorded"}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Procedures Checked
          </h3>
          {fullReport && fullReport.procedures ? (
            <div className="text-lg font-semibold text-gray-900">
              {
                fullReport.procedures.filter(
                  (p: any) => p.overall_status === "Completed",
                ).length
              }{" "}
              / {fullReport.procedures.length}
            </div>
          ) : (
            <div className="text-gray-500 italic">N/A</div>
          )}
          <p className="text-sm text-gray-500 mt-1">Completed items</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Procedures List */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
            Performed Procedures
          </h3>
          <div className="bg-white border rounded-md overflow-hidden">
            {!fullReport ? (
              <div className="p-6 text-center text-gray-500 bg-gray-50">
                No procedures recorded for this quarter yet.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {fullReport.procedures
                  ?.filter((p: any) => p.overall_status === "Completed")
                  .map((proc: any) => (
                    <li
                      key={proc.procedure_id}
                      className="px-4 py-3 flex items-start"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {proc.procedure?.procedure_name ||
                            "Unknown Procedure"}
                        </span>
                        {proc.overall_remarks && (
                          <p className="text-xs text-gray-500 mt-1">
                            {proc.overall_remarks}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                {fullReport.procedures?.filter(
                  (p: any) => p.overall_status === "Completed",
                ).length === 0 && (
                  <li className="px-4 py-3 text-sm text-gray-500 italic">
                    No procedures marked as completed.
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Assets List */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
            Assigned Assets
          </h3>
          <div className="bg-white border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Asset
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Property Tag
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-4 text-center text-sm text-gray-500"
                    >
                      No assets found.
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.asset_id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {asset.unit_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {asset.property_tag_no}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                            asset.status === "Functional" ||
                            asset.status === "Working" ||
                            asset.status === "Operational"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {asset.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceView;
