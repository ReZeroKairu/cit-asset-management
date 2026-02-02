import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { generateTemplateReport } from "../../utils/generateTemplateReport";
import { FileDown } from "lucide-react";

interface ReportData {
  // Define your data structure here
  id: number;
  name: string;
  // ... other fields
}

interface Props {
  show: boolean;
  onClose: () => void;
}

const CustomReport: React.FC<Props> = ({ show, onClose }) => {
  const { user } = useAuth();
  const [data, setData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      fetchData();
    }
  }, [show]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const response = await api.get("/your-endpoint");
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (data.length === 0) return;

    // Structure your data for the template
    const reportData = {
      report_date: new Date().toLocaleDateString(),
      prepared_by: (user?.name || "Unknown User").toUpperCase(),
      // Add your data structure here
      items: data.map(item => ({
        // Map your actual data fields to template variables
        id: item.id,
        name: item.name,
        // Add other fields as needed
      })),
    };

    try {
      await generateTemplateReport(
        "/your_template.docx", // Path to your template in public folder
        reportData,
        `Custom_Report_${new Date().toISOString().split("T")[0]}.docx`,
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
          <div className="relative top-10 mx-auto p-0 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b bg-gray-50 rounded-t-md">
              <h3 className="text-xl font-semibold text-gray-900">
                Your Custom Report
              </h3>
              <button
                onClick={handleDownload}
                disabled={loading || data.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Download Word Doc
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {loading ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading report data...</p>
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                  No data found for this report.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Display your data here */}
                  {data.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold">{item.name}</h4>
                      {/* Display other fields */}
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

export default CustomReport;
