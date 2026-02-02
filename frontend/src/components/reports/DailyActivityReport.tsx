import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { generateTemplateReport } from "../../utils/generateTemplateReport";
import { FileDown } from "lucide-react";

interface DailyReport {
  report_id: number;
  report_date: string;
  general_remarks: string;
  status: string;
  users: {
    full_name: string;
    email: string;
  };
  laboratories: {
    lab_name: string;
    location: string;
  };
}

interface Props {
  show: boolean;
  onClose: () => void;
}

const DailyActivityReport: React.FC<Props> = ({ show, onClose }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLab, setSelectedLab] = useState<string>("");

  useEffect(() => {
    if (show) {
      fetchReports();
    }
  }, [show, selectedLab]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let endpoint = "/daily-reports";
      if (selectedLab) {
        endpoint += `?lab_id=${selectedLab}`;
      }
      
      const response = await api.get(endpoint);
      setReports(response.data);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (reports.length === 0) return;

    // Structure data for template
    const reportData = {
      report_date: new Date().toLocaleDateString(),
      prepared_by: (user?.name || "Unknown User").toUpperCase(),
      total_reports: reports.length,
      reports: reports.map(report => ({
        report_id: report.report_id,
        report_date: new Date(report.report_date).toLocaleDateString(),
        prepared_by: report.users?.full_name || "Unknown",
        lab_name: report.laboratories?.lab_name || "Unassigned",
        location: report.laboratories?.location || "No Location",
        status: report.status,
        remarks: report.general_remarks || "No remarks",
      })),
    };

    try {
      await generateTemplateReport(
        "/daily_activity_template.docx",
        reportData,
        `Daily_Activity_Report_${new Date().toISOString().split("T")[0]}.docx`,
      );
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to generate report. Please check if the template exists.");
    }
  };

  return (
    <>
      {show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-0 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white flex flex-col max-h-[90vh">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b bg-gray-50 rounded-t-md">
              <h3 className="text-xl font-semibold text-gray-900">
                Daily Activity Report
              </h3>
              <button
                onClick={handleDownload}
                disabled={loading || reports.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Download Word Doc
              </button>
            </div>

            {/* Filter Section */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Filter by Lab:
                </label>
                <select
                  className="border rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selectedLab}
                  onChange={(e) => setSelectedLab(e.target.value)}
                >
                  <option value="">All Laboratories</option>
                  {/* Add lab options here */}
                </select>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {loading ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading report data...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                  No daily reports found for the selected criteria.
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.report_id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Report #{report.report_id}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {report.laboratories?.lab_name} - {new Date(report.report_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            By: {report.users?.full_name}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          report.status === 'Approved' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      {report.general_remarks && (
                        <p className="mt-2 text-sm text-gray-700">
                          {report.general_remarks}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DailyActivityReport;
