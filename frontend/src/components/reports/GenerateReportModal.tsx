import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { X, FileText, ClipboardCheck, Zap } from "lucide-react";
import { getSoftwareInstallations } from "../../api/forms";
import type { DailyReport } from "../../api/dailyReports";
import api from "../../api/axios";
import UnifiedReportViewModal from "./UnifiedReportViewModal";

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportGenerated?: () => void; // Callback to notify parent to refresh data
  userLabId?: number;
}

interface Complaint {
  id: number;
  complaint_id: string;
  issue_description: string;
  status: string;
  complaint_status?: string;
  resolved_at?: string;
  created_at?: string;
  remarks?: string;
  asset_info?: string;
  workstation_name?: string;
  workstations?: {
    workstation_name: string;
  };
}

interface ReportData {
  complaints: Complaint[];
  softwareInstallations: any[];
}

const GenerateReportModal: React.FC<GenerateReportModalProps> = ({
  isOpen,
  onClose,
  onReportGenerated,
  userLabId,
}) => {
  const [selectedReportType, setSelectedReportType] = useState<"complaints" | "forms" | "unified" | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return now.getFullYear() + '-' + 
           String(now.getMonth() + 1).padStart(2, '0') + '-' + 
           String(now.getDate()).padStart(2, '0');
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unifiedReport, setUnifiedReport] = useState<DailyReport | null>(null);
  const [showUnifiedModal, setShowUnifiedModal] = useState(false);

  // Update selectedDate to current date whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      // Use local date instead of UTC to fix timezone issue
      const today = now.getFullYear() + '-' + 
                   String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(now.getDate()).padStart(2, '0');
      setSelectedDate(today);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fetchComplaintsData = async (date: string) => {
    try {
      // Get all complaints first (backend doesn't support date filtering yet)
      const response = await api.get(`/complaints`);
      const allComplaints = response.data?.data || response.data || [];
      
      // Filter for complaints that were RESOLVED/COMPLETED on the specific day only
      const filteredComplaints = allComplaints.filter((complaint: Complaint) => {
        // Only use resolved_at for daily reports - not created_at
        const resolvedDate = complaint.resolved_at;
        if (!resolvedDate) return false;
        
        const isResolved = complaint.status === 'Resolved' || complaint.complaint_status === 'Resolved';
        if (!isResolved) return false;
        
        // Use local date comparison to match the selected date format
        const complaintLocalDate = new Date(resolvedDate);
        const complaintDateOnly = complaintLocalDate.getFullYear() + '-' + 
                                 String(complaintLocalDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                 String(complaintLocalDate.getDate()).padStart(2, '0');
        
        return complaintDateOnly === date;
      });
      
      return filteredComplaints;
    } catch (error) {
      console.error('Error fetching complaints data:', error);
      return [];
    }
  };

  const fetchFormsData = async (date: string) => {
    try {
          // Get only software installation forms
      const softwareInstallationsResponse = await getSoftwareInstallations();

      // Extract array data from API response
      const softwareInstallations = softwareInstallationsResponse?.data || softwareInstallationsResponse || [];

      // Filter for completed forms with feedback_date matching the selected date
      const completedSoftware = softwareInstallations.filter((form: any) => {
        const isCompleted = form.status === "Completed" || form.status === "Approved";
        if (!isCompleted) return false;
        
        // Filter by feedback_date for software installations
        const feedbackDate = form.feedback_date;
        if (!feedbackDate) return false;
        
        const formLocalDate = new Date(feedbackDate);
        const formDateOnly = formLocalDate.getFullYear() + '-' + 
                           String(formLocalDate.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(formLocalDate.getDate()).padStart(2, '0');
        
        return formDateOnly === date;
      });

      return {
        softwareInstallations: completedSoftware,
        citLabUsers: [] // Empty - not included in forms report
      };
    } catch (error) {
      console.error("Error fetching forms:", error);
      return {
        softwareInstallations: [],
        citLabUsers: []
      };
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReportType || !selectedDate) {
      setError("Please select a report type and date");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (selectedReportType === "unified") {
        // Use the new backend endpoint that fetches data server-side
        try {
          await api.post('/daily-reports/generate-unified', {
            report_date: selectedDate,
            lab_id: userLabId
          });

          // Report created successfully
          onClose();
          onReportGenerated?.(); // Notify parent to refresh data
          return;
        } catch (error: any) {
          console.error('Error generating unified report:', error);
          setError(error.response?.data?.error || "Failed to generate unified report");
          setLoading(false);
          return;
        }
      }

      let reportData: ReportData = {
        complaints: [],
        softwareInstallations: []
      };

      if (selectedReportType === "complaints") {
        reportData.complaints = await fetchComplaintsData(selectedDate);
        
        if (reportData.complaints.length === 0) {
          setError("No resolved complaints found for the selected date");
          setLoading(false);
          return;
        }

        // Generate complaints report
        await generateComplaintsReport(reportData.complaints, selectedDate);
      } else if (selectedReportType === "forms") {
        const formsData = await fetchFormsData(selectedDate);
        reportData.softwareInstallations = formsData.softwareInstallations;

        if (reportData.softwareInstallations.length === 0) {
          setError("No completed software installations found for the selected date");
          setLoading(false);
          return;
        }

        // Generate forms report
        await generateFormsReport(reportData, selectedDate);
      }

      onClose();
      onReportGenerated?.(); // Notify parent to refresh data
    } catch (error) {
      console.error("Error generating report:", error);
      setError(`Failed to generate report: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const generateComplaintsReport = async (complaints: Complaint[], date: string) => {
    try {
      // Map complaints to workstation format for template (using checked property for auto template)
      // First, map all complaints to workstations
      const allWorkstations = complaints.slice(0, 40).map((complaint, index) => {
        // Extract actual workstation ID from the complaint data
        // Try to get the workstation ID from the nested workstations object first
        let actualWorkstationId = complaint.workstations?.workstation_name?.match(/\d+/)?.[0];
        
        // If not found, try from the flat workstation_name field
        if (!actualWorkstationId) {
          actualWorkstationId = complaint.workstation_name?.match(/\d+/)?.[0];
        }
        
        // If still not found, use sequential ID as fallback
        if (!actualWorkstationId) {
          actualWorkstationId = String(index + 1);
        }
        
        const wsId = parseInt(actualWorkstationId);
        
        return {
          workstation_id: wsId,
          workstation_name: complaint.workstations?.workstation_name || complaint.workstation_name || `WS ${actualWorkstationId}`,
          status: "Working", // Use "Working" to show checkmark in template
          remarks: "", // Empty remarks
          checked: true // Important for auto template checkmarks
        };
      });
      
      // Deduplicate workstations by ID to prevent duplicate entries
      const uniqueWorkstations = allWorkstations.reduce((acc: any[], current: any) => {
        const existing = acc.find(ws => ws.workstation_id === current.workstation_id);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []);

      // First, create a database entry for this auto-generated report
      const reportPayload = {
        lab_id: userLabId || 2,
        report_date: date,
        report_type: 'auto_complaints',
        general_remarks: complaints.slice(0, 40).map((complaint) => {
          // Format time from resolved_at
          const timeString = complaint.resolved_at || complaint.created_at || '';
          const formattedTime = timeString ? new Date(timeString).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }) : '';
          
          const workstationName = complaint.workstations?.workstation_name || complaint.workstation_name || 'Unknown WS';
          return `• ${formattedTime} - ${workstationName} [Asset: ${complaint.asset_info || 'N/A'}] (${complaint.status}) - Remarks: ${complaint.remarks || 'No remarks'}`;
        }).join('\n'),
        generated_data: {
          complaints_count: complaints.length,
          complaints: complaints.slice(0, 40).map(c => ({
            id: c.id,
            complaint_id: c.complaint_id,
            issue_description: c.issue_description,
            workstation_name: c.workstations?.workstation_name || c.workstation_name,
            resolved_at: c.resolved_at,
            status: c.status,
            asset_info: c.asset_info,
            remarks: c.remarks
          }))
        },
        // Include procedures and workstation data
        procedures: [
          { procedure_id: 5, overall_status: "Completed", overall_remarks: "" }, // hardware checks
          { procedure_id: 6, overall_status: "Completed", overall_remarks: "" } // cleanliness & organization
        ],
        workstation_items: uniqueWorkstations.map(ws => ({
          workstation_id: ws.workstation_id,
          status: "",
          remarks: ws.remarks
        }))
      };

      await api.post('/daily-reports/auto-generated', reportPayload);

      // Report created successfully - no automatic download
      // Download can be triggered manually from the report list
    } catch (error) {
      console.error('Error generating complaints report:', error);
      throw error;
    }
  };

  const generateFormsReport = async (reportData: ReportData, date: string) => {
    try {
      // Map software installations for the report
      const allForms = reportData.softwareInstallations.map(form => ({
        ...form,
        form_type: "Software Installation",
        // Use correct field names from software_installations model
        full_name: form.faculty_name,
        email: form.users?.email || '',
        laboratory: form.laboratory,
        software_list: form.software_list,
        software_name: form.software_list, // For consistency
        installation_remarks: form.installation_remarks,
        purpose: form.installation_remarks // For consistency
      }));

      // First, create a database entry for this auto-generated report
      const formsPayload = {
        lab_id: userLabId || 2,
        report_date: date,
        report_type: 'auto_forms',
        general_remarks: allForms.slice(0, 3).map((form) => {
          const timeString = form.feedback_date || form.created_at || '';
          const formattedTime = timeString ? new Date(timeString).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }) : '';
          
          const facultyName = form.faculty_name;
          const softwareName = form.software_list;
          const installationRemarks = form.installation_remarks;
          
          return `• ${formattedTime} - Software: ${softwareName} [Faculty: ${facultyName}] - ${installationRemarks || 'No remarks'}`;
        }).join('\n'),
        generated_data: {
          forms_count: allForms.length,
          software_installations_count: reportData.softwareInstallations.length,
          forms: allForms.slice(0, 40).map(f => ({
            id: f.id,
            form_type: f.form_type,
            full_name: f.full_name,
            email: f.email,
            laboratory: f.laboratory,
            software_list: f.software_list,
            software_name: f.software_name || f.software_list,
            installation_remarks: f.installation_remarks,
            purpose: f.purpose || f.installation_remarks
          }))
        },
        // Include procedures only (no workstation data for software installations)
        procedures: [
          { procedure_id: 2, overall_status: reportData.softwareInstallations.length > 0 ? "Completed" : "", overall_remarks: "" } // software checks only
        ]
      };

      await api.post('/daily-reports/auto-generated', formsPayload);

      // Report created successfully - no automatic download
      // Download can be triggered manually from the report list
    } catch (error) {
      console.error('Error generating forms report:', error);
      throw error;
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-md bg-black/20 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Generate Daily Report</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedReportType("complaints")}
                className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                  selectedReportType === "complaints"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <ClipboardCheck className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Complaints Report</div>
                  <div className="text-sm text-gray-600">
                    All resolved complaints within the day
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedReportType("forms")}
                className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                  selectedReportType === "forms"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <FileText className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Forms Report</div>
                  <div className="text-sm text-gray-600">
                    Completed software installation forms within the day
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedReportType("unified")}
                className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                  selectedReportType === "unified"
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Zap className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Unified Report</div>
                  <div className="text-sm text-gray-600">
                    View combined complaints and forms report
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Date
            </label>
            <input
              key={selectedDate}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerateReport}
            disabled={!selectedReportType || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Generating..." : "Generate Report"}
          </Button>
        </div>
        </div>
      </div>
    )}

    {showUnifiedModal && unifiedReport && (
      <UnifiedReportViewModal
        report={unifiedReport}
        isOpen={showUnifiedModal}
        onClose={() => {
          setShowUnifiedModal(false);
          setUnifiedReport(null);
          onClose();
        }}
      />
    )}
    </>
  );
};

export default GenerateReportModal;
