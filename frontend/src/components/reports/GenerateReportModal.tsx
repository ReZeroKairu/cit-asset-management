import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { X, FileText, ClipboardCheck, Zap, Wrench, Package } from "lucide-react";
import { getSoftwareInstallations } from "../../api/forms";
import { getMaintenanceServicesByDate } from "../../api/maintenance";
import { getInventory } from "../../api/inventory";
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
  const [selectedReportType, setSelectedReportType] = useState<"complaints" | "forms" | "maintenance" | "inventory" | "unified" | null>(null);
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
        const isCompleted = form.status === "Completed";
        if (!isCompleted) return false;

        // Strictly filter by completed_at (ignore old records with only feedback_date)
        const completionDate = form.completed_at;
        if (!completionDate) return false;

        const formLocalDate = new Date(completionDate);
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

  const fetchMaintenanceData = async (date: string) => {
    try {
      // Get maintenance service logs for the date using the API function
      const maintenanceServices = await getMaintenanceServicesByDate(date, userLabId);

      // The backend already filters by date, so no need to filter again
      return maintenanceServices;
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      return [];
    }
  };

  const fetchInventoryData = async (date: string) => {
    try {
      const allAssets = await getInventory({ lab_id: userLabId });
      const inventoryAssets = Array.isArray(allAssets) ? allAssets : [];

      const selectedDateString = date;
      return inventoryAssets.filter((asset: any) => {
        const disposedBy = asset.asset_details?.disposed_by;
        const disposedDate = asset.asset_details?.date_disposed;
        const statusName = asset.asset_details?.asset_statuses?.status_name;

        if (!disposedBy?.trim() || !disposedDate || statusName !== 'Disposed') {
          return false;
        }

        const assetDate = new Date(disposedDate);
        const assetDateOnly = assetDate.getFullYear() + '-' +
          String(assetDate.getMonth() + 1).padStart(2, '0') + '-' +
          String(assetDate.getDate()).padStart(2, '0');

        return assetDateOnly === selectedDateString;
      });
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      return [];
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
      } else if (selectedReportType === "maintenance") {
        const maintenanceServices = await fetchMaintenanceData(selectedDate);

        if (maintenanceServices.length === 0) {
          setError("No maintenance services found for the selected date");
          setLoading(false);
          return;
        }

        // Generate maintenance report
        await generateMaintenanceReport(maintenanceServices, selectedDate);
      } else if (selectedReportType === "inventory") {
        const inventoryAssets = await fetchInventoryData(selectedDate);

        if (inventoryAssets.length === 0) {
          setError("No inventory items found for the selected date");
          setLoading(false);
          return;
        }

        // Generate inventory report
        await generateInventoryReport(inventoryAssets, selectedDate);
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

      // Sort complaints by resolution time (old to latest)
      const sortedComplaints = [...complaints].sort((a, b) => {
        const timeA = new Date(a.resolved_at || a.created_at || 0).getTime();
        const timeB = new Date(b.resolved_at || b.created_at || 0).getTime();
        return timeA - timeB;
      });

      // First, create a database entry for this auto-generated report
      const reportPayload = {
        lab_id: userLabId || 2,
        report_date: date,
        report_type: 'auto_complaints',
        general_remarks: sortedComplaints.slice(0, 40).map((complaint) => {
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
          complaints: sortedComplaints.slice(0, 40).map(c => ({
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
        purpose: form.installation_remarks, // For consistency
        created_at: form.created_at,
        updated_at: form.updated_at
      }));

      // Sort forms by completion time (old to latest)
      allForms.sort((a, b) => {
        const timeA = new Date(a.completed_at || a.updated_at || a.created_at || 0).getTime();
        const timeB = new Date(b.completed_at || b.updated_at || b.created_at || 0).getTime();
        return timeA - timeB;
      });

      // First, create a database entry for this auto-generated report
      const formsPayload = {
        lab_id: userLabId || 2,
        report_date: date,
        report_type: 'auto_forms',
        general_remarks: allForms.slice(0, 40).map((form) => {
          // Ensure we use the most recent timestamp (updated_at) for the remark time
          const timeString = form.completed_at || form.updated_at || form.created_at || form.feedback_date || '';
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
            purpose: f.purpose || f.installation_remarks,
            created_at: f.created_at, // Keep created_at for context
            updated_at: f.updated_at, // Keep updated_at for context
            completed_at: f.completed_at // Include completed_at
          }))
        },
        procedures: [
          { procedure_id: 2, overall_status: reportData.softwareInstallations.length > 0 ? "Completed" : "", overall_remarks: "" } // software checks only
        ],
        workstation_items: [] // Start with no workstations so custodian can manually assign them in editor
      };

      await api.post('/daily-reports/auto-generated', formsPayload);

      // Report created successfully - no automatic download
      // Download can be triggered manually from the report list
    } catch (error) {
      console.error('Error generating forms report:', error);
      throw error;
    }
  };

  const generateMaintenanceReport = async (maintenanceServices: any[], date: string) => {
    try {
      // Map service logs for the report
      const allServices = maintenanceServices.map(log => ({
        ...log,
        workstation_name: log.pmc_reports?.workstations?.workstation_name || 'Unknown WS',
        overall_remarks: log.pmc_reports?.overall_remarks || log.remarks || 'No remarks',
        service_type: log.service_type || 'ROUTINE',
        service_date: log.service_date, // Date for filtering
        created_at: log.created_at // Actual timestamp with time
      }));

      // Sort services by created_at to ensure chronological order in remarks
      allServices.sort((a, b) => {
        const dateA = new Date(a.created_at || a.service_date).getTime();
        const dateB = new Date(b.created_at || b.service_date).getTime();
        return dateA - dateB;
      });

      // Extract procedures from maintenance services
      console.log('🔧 Maintenance services for procedure extraction:', maintenanceServices.map(s => ({
        log_id: s.log_id,
        has_service_log_procedures: !!s.service_log_procedures,
        service_log_procedures_count: s.service_log_procedures?.length || 0,
        has_pmc_report_procedures: !!s.pmc_reports?.pmc_report_procedures,
        pmc_report_procedures_count: s.pmc_reports?.pmc_report_procedures?.length || 0
      })));

      const allProcedures = new Set<number>();
      maintenanceServices.forEach(log => {
        // Extract procedures from service_log_procedures
        if (log.service_log_procedures && Array.isArray(log.service_log_procedures)) {
          log.service_log_procedures.forEach((slp: any) => {
            if (slp.procedures) {
              console.log('✅ Found procedure from service_log_procedures:', slp.procedures);
              allProcedures.add(slp.procedures.procedure_id);
            }
          });
        }
        // Extract procedures from pmc_report_procedures
        if (log.pmc_reports?.pmc_report_procedures && Array.isArray(log.pmc_reports.pmc_report_procedures)) {
          log.pmc_reports.pmc_report_procedures.forEach((prp: any) => {
            if (prp.procedures) {
              console.log('✅ Found procedure from pmc_report_procedures:', prp.procedures);
              allProcedures.add(prp.procedures.procedure_id);
            }
          });
        }
      });

      console.log('📋 Extracted procedure IDs:', Array.from(allProcedures));

      // Map maintenance procedures to DAR procedures
      const darProcedureIds = new Set<number>();
      allProcedures.forEach(procId => {
        // Map maintenance/QPMC procedures to DAR procedures
        // QPMC procedures (8-13) map to DAR procedures (1-7)
        switch (procId) {
          case 8: // Hardware Maintenance → Hardware Checks
            darProcedureIds.add(5);
            break;
          case 9: // Software Maintenance → Software Checks
            darProcedureIds.add(2);
            break;
          case 10: // Security Maintenance → Security & Safety
            darProcedureIds.add(3);
            break;
          case 11: // Network Maintenance → Network & Connectivity
            darProcedureIds.add(4);
            break;
          case 12: // System Performance → End of the day checks
            darProcedureIds.add(7);
            break;
          case 13: // Regular Cleaning → Cleanliness & Organization
            darProcedureIds.add(6);
            break;
          default:
            // If it's already a DAR procedure (1-7), use it directly
            if (procId >= 1 && procId <= 7) {
              darProcedureIds.add(procId);
            }
            break;
        }
      });

      // If no specific procedures found, default to maintenance checks (procedure_id 3)
      if (darProcedureIds.size === 0 && maintenanceServices.length > 0) {
        console.log('⚠️ No procedures found, defaulting to procedure_id 3');
        darProcedureIds.add(3);
      }

      // Convert to procedures array
      const procedures = Array.from(darProcedureIds).map(procId => ({
        procedure_id: procId,
        overall_status: "Completed",
        overall_remarks: ""
      }));

      console.log('📤 Final procedures to send to backend:', procedures);

      // Extract workstations from maintenance services
      const maintenanceWorkstations = maintenanceServices.map((log, index) => ({
        workstation_id: log.pmc_reports?.workstation_id || index + 1,
        workstation_name: log.pmc_reports?.workstations?.workstation_name || log.workstation_name || 'Unknown Workstation',
        status: "Working",
        remarks: ""
      }));

      // Deduplicate workstations
      const uniqueMaintenanceWorkstations = maintenanceWorkstations.reduce((acc: any[], current: any) => {
        const existing = acc.find(ws => ws.workstation_id === current.workstation_id);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []);

      // Create a database entry for this auto-generated maintenance report
      const maintenancePayload = {
        lab_id: userLabId || 2,
        report_date: date,
        report_type: 'auto_maintenance',
        generated_data: {
          maintenance_services_count: maintenanceServices.length,
          maintenance_services: allServices.slice(0, 40).map(m => ({
            id: m.log_id,
            workstation_name: m.workstation_name,
            overall_remarks: m.overall_remarks,
            service_date: m.service_date,
            created_at: m.created_at,
            service_type: m.service_type
          }))
        },
        general_remarks: allServices.slice(0, 40).map((service) => {
          // Use created_at for actual time (service_date only has date, no time)
          const timeString = service.created_at || service.service_date || '';
          const formattedTime = timeString ? new Date(timeString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) : '';

          const workstationName = service.workstation_name;
          const overallRemarks = service.overall_remarks;

          return `• ${formattedTime} - ${workstationName} - ${overallRemarks}`;
        }).join('\n'),
        procedures: procedures,
        workstation_items: uniqueMaintenanceWorkstations.map(ws => ({
          workstation_id: ws.workstation_id,
          status: "",
          remarks: ws.remarks
        }))
      };

      await api.post('/daily-reports/auto-generated', maintenancePayload);

      // Report created successfully - no automatic download
      // Download can be triggered manually from the report list
    } catch (error) {
      console.error('Error generating maintenance report:', error);
      throw error;
    }
  };

  const generateInventoryReport = async (inventoryAssets: any[], date: string) => {
    try {
      const formattedAssets = inventoryAssets.slice(0, 40).map((asset: any) => ({
        asset_id: asset.asset_id,
        property_tag_no: asset.asset_details?.property_tag_no || "N/A",
        serial_number: asset.asset_details?.serial_number || "N/A",
        description: asset.asset_details?.description || asset.description || "N/A",
        workstation_id: asset.workstations?.workstation_id || null,
        workstation_name: asset.workstations?.workstation_name || "Unassigned",
        lab_name: asset.laboratories?.lab_name || "Unknown",
        status: asset.asset_details?.asset_statuses?.status_name || "Unknown",
        date_added: asset.date_added,
        date_of_purchase: asset.asset_details?.date_of_purchase,
        date_disposed: asset.asset_details?.date_disposed,
      }));

      const disposedByNames = Array.from(new Set(
        inventoryAssets
          .map((asset: any) => asset.asset_details?.disposed_by)
          .filter((name: string | null | undefined) => !!name)
      ));
      const disposedByLabel = disposedByNames.length === 0
        ? 'Unknown'
        : disposedByNames.join(', ');

      // Build workstation_items from the inventory assets (unique workstation_ids)
      const uniqueWorkstationIds = Array.from(new Set(inventoryAssets.map((a: any) => a.workstations?.workstation_id).filter((id: any) => !!id)));
      const workstationItemsPayload = uniqueWorkstationIds.map((id: any) => ({ workstation_id: id, status: 'Working', remarks: '' }));

      const inventoryPayload = {
        lab_id: userLabId || 2,
        report_date: date,
        report_type: 'auto_inventory',
        general_remarks: `Total disposed assets - ${inventoryAssets.length}, Disposal personnel - ${disposedByLabel}`,
        generated_data: {
          inventory_count: inventoryAssets.length,
          inventory_items: formattedAssets,
        },
        procedures: [
          { procedure_id: 5, overall_status: "Completed", overall_remarks: "" } // Hardware Checks
        ],
        workstation_items: workstationItemsPayload
      };

      await api.post('/daily-reports/auto-generated', inventoryPayload);
    } catch (error) {
      console.error('Error generating inventory report:', error);
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
                onClick={() => setSelectedReportType("maintenance")}
                className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                  selectedReportType === "maintenance"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Wrench className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Maintenance Report</div>
                  <div className="text-sm text-gray-600">
                    Workstation services performed within the day
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedReportType("inventory")}
                className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                  selectedReportType === "inventory"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Package className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Disposal Inventory Report</div>
                  <div className="text-sm text-gray-600">
                    Disposed assets on the selected date
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
                    View combined complaints, forms, and maintenance report
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
