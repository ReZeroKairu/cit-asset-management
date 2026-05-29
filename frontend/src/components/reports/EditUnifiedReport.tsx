import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import type { DailyReport } from "../../api/dailyReports";
import { updateDailyReport } from "../../api/dailyReports";
import { getAllProcedures, saveReportProcedures } from "../../api/procedures";
import { getLabWorkstationsForReport } from "../../api/workstationReports";
import api from "../../api/axios";
import type { Procedure, ReportProcedure } from "../../api/procedures";
import ComplaintsSection from "./ComplaintsSection";
import FormsSection from "./FormsSection";
import MaintenanceSection from "./MaintenanceSection";

interface EditUnifiedReportProps {
  report: DailyReport | null;
  isOpen: boolean;
  onClose: () => void;
  onReportUpdated?: () => void;
}

const EditUnifiedReport: React.FC<EditUnifiedReportProps> = ({
  report,
  isOpen,
  onClose,
  onReportUpdated,
}) => {
  const [editedRemarks, setEditedRemarks] = useState({
    complaintsRemarks: '',
    formsRemarks: '',
    maintenanceRemarks: ''
  });
  const [procedures, setProcedures] = useState<ReportProcedure[]>([]);
  const [complaintsProcs, setComplaintsProcs] = useState<number[]>([]);
  const [formsProcs, setFormsProcs] = useState<number[]>([]);
  const [maintenanceProcs, setMaintenanceProcs] = useState<number[]>([]);
  const [complaintsWorkstations, setComplaintsWorkstations] = useState<any[]>([]);
  const [formsWorkstations, setFormsWorkstations] = useState<any[]>([]);
  const [maintenanceWorkstations, setMaintenanceWorkstations] = useState<any[]>([]);
  const [isComplaintsWorkstationDropdownOpen, setIsComplaintsWorkstationDropdownOpen] = useState(false);
  const [isFormsWorkstationDropdownOpen, setIsFormsWorkstationDropdownOpen] = useState(false);
  const [isMaintenanceWorkstationDropdownOpen, setIsMaintenanceWorkstationDropdownOpen] = useState(false);
  const [isComplaintsProcedureDropdownOpen, setIsComplaintsProcedureDropdownOpen] = useState(false);
  const [isFormsProcedureDropdownOpen, setIsFormsProcedureDropdownOpen] = useState(false);
  const [isMaintenanceProcedureDropdownOpen, setIsMaintenanceProcedureDropdownOpen] = useState(false);
  const [complaintsWorkstationSearch, setComplaintsWorkstationSearch] = useState("");
  const [formsWorkstationSearch, setFormsWorkstationSearch] = useState("");
  const [maintenanceWorkstationSearch, setMaintenanceWorkstationSearch] = useState("");
  const [complaintsProcedureSearch, setComplaintsProcedureSearch] = useState("");
  const [formsProcedureSearch, setFormsProcedureSearch] = useState("");
  const [maintenanceProcedureSearch, setMaintenanceProcedureSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Reset edited remarks when report changes
  useEffect(() => {
    if (report) {
      const generatedData = (report as any).generated_data || {};
      setEditedRemarks({
        complaintsRemarks: generatedData.complaints_remarks || '',
        formsRemarks: generatedData.forms_remarks || '',
        maintenanceRemarks: generatedData.maintenance_remarks || ''
      });
      setError('');
      setSuccessMessage('');
      loadProcedures();
      loadWorkstations(report.lab_id);
      loadReportData(report.report_id);
    }
  }, [report]);

  // Handle outside clicks for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if we clicked a button (likely a trigger) or an input (the search)
      if (target.tagName === 'BUTTON' || target.tagName === 'INPUT') return;

      setIsComplaintsWorkstationDropdownOpen(false);
      setIsFormsWorkstationDropdownOpen(false);
      setIsMaintenanceWorkstationDropdownOpen(false);
      setIsComplaintsProcedureDropdownOpen(false);
      setIsFormsProcedureDropdownOpen(false);
      setIsMaintenanceProcedureDropdownOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isComplaintsWorkstationDropdownOpen, isFormsWorkstationDropdownOpen, isMaintenanceWorkstationDropdownOpen, isComplaintsProcedureDropdownOpen, isFormsProcedureDropdownOpen, isMaintenanceProcedureDropdownOpen]);

  const loadProcedures = async () => {
    try {
      const data = await getAllProcedures();
      const darProcedures = data.filter((proc: any) => proc.category === "DAR");
      const initializedProcedures = darProcedures.map((proc: Procedure) => ({
        ...proc,
        overall_status: "Pending",
        overall_remarks: "",
        checklists: [],
      }));
      setProcedures(initializedProcedures);
    } catch (err: any) {
      console.error("Failed to load procedures:", err);
    }
  };

  const loadWorkstations = async (labId: number) => {
    try {
      const data = await getLabWorkstationsForReport(labId);
      const sortedData = data.sort((a: any, b: any) => {
        const numA = parseInt(a.workstation_name?.match(/\d+/)?.[0] || "0");
        const numB = parseInt(b.workstation_name?.match(/\d+/)?.[0] || "0");
        return numA - numB;
      });
      const initializedWorkstations = sortedData.map((ws: any) => ({
        ...ws,
        checked: false,
      }));
      setComplaintsWorkstations(initializedWorkstations);
      setFormsWorkstations(initializedWorkstations);
      setMaintenanceWorkstations(initializedWorkstations);
    } catch (err: any) {
      console.error("Failed to load workstations:", err);
    }
  };

  const loadReportData = async (reportId: number) => {
    try {
      const reportData = await api.get(`/daily-reports/${reportId}`);
      const savedProcedures = reportData.data.procedures || [];
      const savedWorkstationItems = reportData.data.workstation_items || [];
      const labId = reportData.data.lab_id || 0;
      const generatedData = reportData.data.generated_data || {};

      // Helper to extract IDs from generated data items
      const getIdsFromSection = (items: any[], idKey: string) => {
        const ids = new Set<number>();
        items.forEach(item => {
          if (item[idKey]) ids.add(Number(item[idKey]));
          // Handle software installation nested workstations
          if (item.workstations && Array.isArray(item.workstations)) {
            item.workstations.forEach((ws: any) => {
              if (ws[idKey]) ids.add(Number(ws[idKey]));
            });
          }
        });
        return ids;
      };

      const complaintWsIds = getIdsFromSection(generatedData.complaints || [], 'workstation_id');
      const softwareWsIds = getIdsFromSection(generatedData.software_installations || [], 'workstation_id');
      const maintenanceWsIds = getIdsFromSection(generatedData.maintenance_services || [], 'workstation_id');

      // Load all available procedures
      const allProcedures = await getAllProcedures();
      const darProcedures = allProcedures.filter((proc: any) => proc.category === "DAR");

      // Merge procedures with saved status
      const mergedProcedures = darProcedures.map((proc: Procedure) => {
        const savedProc = savedProcedures.find((sp: any) => sp.procedure_id === proc.procedure_id);
        return {
          ...proc,
          overall_status: "Pending", // Selection state is now tracked in scoped arrays
          overall_remarks: savedProc ? savedProc.overall_remarks : "",
          checklists: [],
        };
      });
      setProcedures(mergedProcedures);

      // Initialize section-specific procedure selections
      const cProcs = new Set<number>();
      const fProcs = new Set<number>();
      const mProcs = new Set<number>();

      // 1. Extract from generated snapshot metadata
      (generatedData.complaints || []).forEach((c: any) => (c.procedure_ids || []).forEach((id: any) => cProcs.add(Number(id))));
      (generatedData.software_installations || []).forEach((s: any) => (s.procedure_ids || []).forEach((id: any) => fProcs.add(Number(id))));
      (generatedData.maintenance_services || []).forEach((m: any) => (m.procedures || m.procedure_ids || []).forEach((p: any) => mProcs.add(Number(p.procedure_id || p))));

      // 2. Map existing saved completion status to sections based on default DAR categories
      savedProcedures.forEach((sp: any) => {
        if (sp.overall_status === "Completed") {
          const id = Number(sp.procedure_id);
          if ([5, 6].includes(id)) cProcs.add(id);
          else if ([2].includes(id)) fProcs.add(id);
          else mProcs.add(id);
        }
      });

      setComplaintsProcs(Array.from(cProcs));
      setFormsProcs(Array.from(fProcs));
      setMaintenanceProcs(Array.from(mProcs));

      // Load workstations - always load available workstations
      const availableWorkstations = await getLabWorkstationsForReport(labId);
      
      const savedWorkstationMap = new Map();
      savedWorkstationItems.forEach((savedWs: any) => {
        savedWorkstationMap.set(savedWs.workstation_id, savedWs);
      });
      
      const prepareSectionWorkstations = (sectionIds: Set<number>) => {
        return availableWorkstations.map((availableWs: any) => {
          const savedWs = savedWorkstationMap.get(availableWs.workstation_id);
          const isSectionMember = sectionIds.has(availableWs.workstation_id);
          
          return {
            ...availableWs,
            // Checked if it was part of this section's source data
            checked: isSectionMember,
            status: savedWs?.status || "Working",
            remarks: savedWs?.remarks || "",
          };
        }).sort(sortWorkstations);
      };

      const sortWorkstations = (a: any, b: any) => {
        const numA = parseInt(a.workstation_name?.match(/\d+/)?.[0] || "0");
        const numB = parseInt(b.workstation_name?.match(/\d+/)?.[0] || "0");
        return numA - numB;
      };
      
      setComplaintsWorkstations(prepareSectionWorkstations(complaintWsIds));
      setFormsWorkstations(prepareSectionWorkstations(softwareWsIds));
      setMaintenanceWorkstations(prepareSectionWorkstations(maintenanceWsIds));
    } catch (err: any) {
      console.error("Failed to load report data:", err);
    }
  };

  const handleSave = async () => {
    if (!report) return;

    try {
      setLoading(true);
      setError('');

      // Prepare updated generated_data by syncing selected workstations back into the section items
      const currentGeneratedData = { ...(report as any).generated_data || {} };

      // Helper to sync section workstations AND procedures back into the generated_data arrays
      const syncSectionData = (originalItems: any[], sectionState: any[], selectedProcIds: number[], type: 'complaint' | 'maintenance') => {
        const checkedWs = sectionState.filter(ws => ws.checked);
        const checkedIds = new Set(checkedWs.map(ws => ws.workstation_id));

        // 1. Keep/Filter existing items if their workstation is still checked and update their procedures
        let updatedItems = (originalItems || [])
          .filter(item => checkedIds.has(Number(item.workstation_id)))
          .map(item => ({
            ...item,
            ...(type === 'maintenance' 
              ? { procedures: selectedProcIds.map(id => ({ procedure_id: id })) } 
              : { procedure_ids: selectedProcIds })
          }));

        // 2. Add new placeholder items for workstations that were checked but don't have a record yet
        const existingIds = new Set(updatedItems.map(item => Number(item.workstation_id)));
        checkedWs.forEach(ws => {
          if (!existingIds.has(ws.workstation_id)) {
            updatedItems.push({
              workstation_id: ws.workstation_id,
              workstation_name: ws.workstation_name,
              remarks: "Manually added in editor",
              status: "Resolved",
              // Add empty procedures array for maintenance to prevent view modal issues
              ...(type === 'maintenance' 
                ? { procedures: selectedProcIds.map(id => ({ procedure_id: id })) } 
                : { procedure_ids: selectedProcIds })
            });
          }
        });
        return updatedItems;
      };

      // Sync Complaints with current selections
      currentGeneratedData.complaints = syncSectionData(
        currentGeneratedData.complaints, 
        complaintsWorkstations,
        complaintsProcs,
        'complaint'
      );

      // Sync Maintenance with current selections
      currentGeneratedData.maintenance_services = syncSectionData(
        currentGeneratedData.maintenance_services, 
        maintenanceWorkstations,
        maintenanceProcs,
        'maintenance'
      );

      // Update software installations with selected workstations from Forms section
      if (currentGeneratedData.software_installations) {
        const selectedFormsWs = formsWorkstations
          .filter(ws => ws.checked)
          .map(ws => ({
            workstation_id: ws.workstation_id,
            workstation_name: ws.workstation_name
          }));
        
        currentGeneratedData.software_installations = currentGeneratedData.software_installations.map((item: any) => ({
          ...item,
          workstations: selectedFormsWs,
          procedure_ids: formsProcs
        }));
      }

      // Sync remarks
      const updatedGeneratedData = {
        ...currentGeneratedData,
        complaints_remarks: editedRemarks.complaintsRemarks,
        forms_remarks: editedRemarks.formsRemarks,
        maintenance_remarks: editedRemarks.maintenanceRemarks
      };

      // Update the unified report with new remarks (don't update general remarks)
      await updateDailyReport(report.report_id, {
        generated_data: updatedGeneratedData
      });

      // Save workstation data - merge from all sections
      const allCheckedWorkstations = [
        ...complaintsWorkstations.filter(ws => ws.checked),
        ...formsWorkstations.filter(ws => ws.checked),
        ...maintenanceWorkstations.filter(ws => ws.checked)
      ];

      // Deduplicate by workstation_id
      const uniqueWorkstations = Array.from(
        new Map(allCheckedWorkstations.map(ws => [ws.workstation_id, ws])).values()
      );

      if (uniqueWorkstations.length > 0) {
        await api.post(
          `/daily-reports/${report.report_id}/workstations`,
          {
            reportId: report.report_id,
            workstations: uniqueWorkstations.map((ws) => ({
              workstation_id: ws.workstation_id,
              status: ws.status || "Working",
              remarks: ws.remarks || null,
            })),
          }
        );
      }

      // Merge selection state from all sections for the final database update
      const allSelectedProcIds = new Set([...complaintsProcs, ...formsProcs, ...maintenanceProcs]);
      
      const proceduresData = Array.from(allSelectedProcIds).map(id => ({
        procedure_id: id,
        overall_status: "Completed",
        overall_remarks: procedures.find(p => p.procedure_id === id)?.overall_remarks || "",
        checklists: [],
      }));

      await saveReportProcedures(report.report_id, proceduresData);

      setSuccessMessage('Report updated successfully!');

      if (onReportUpdated) {
        onReportUpdated();
      }

      // Close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update report');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (report) {
      const generatedData = (report as any).generated_data || {};
      setEditedRemarks({
        complaintsRemarks: generatedData.complaints_remarks || '',
        formsRemarks: generatedData.forms_remarks || '',
        maintenanceRemarks: generatedData.maintenance_remarks || ''
      });
    }
    setError('');
    onClose();
  };

  // Add ESC key support
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!report || !isOpen) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = String(hours % 12 || 12).padStart(2, "0");

    return `${month} ${day}, ${year} ${formattedHours}:${minutes} ${ampm}`;
  };

  const generatedData = (report as any).generated_data || {};
  const complaints = generatedData.complaints || [];
  const softwareInstallations = generatedData.software_installations || [];
  const maintenanceServices = generatedData.maintenance_services || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div>
          <button
            onClick={onClose}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Reports
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Unified Report
          </h1>
          <p className="mt-2 text-gray-600">
            Report #{report.report_id} • Created{" "}
            {formatDateTime(report.created_at || report.report_date)}
          </p>
        </div>
      </div>

      {/* Single Page Report View */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Report Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm font-medium text-gray-600">Report ID</div>
              <div className="text-xl font-bold text-gray-900">
                #{report.report_id}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Status</div>
              <span
                className={`inline-flex px-3 py-1 text-sm font-bold rounded-full border ${
                  report.status === "Approved"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                }`}
              >
                {report.status || "Pending"}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Created</div>
              <div className="text-xl font-bold text-gray-900">
                {formatDateTime(report.created_at || report.report_date)}
              </div>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-6">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded m-6">
            {successMessage}
          </div>
        )}

        {/* Report Content */}
        <div className="p-6 space-y-6">
          {/* Custodian & Laboratory Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                👤 Custodian
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Name:</span>{" "}
                  {report.users?.full_name || ""}
                </div>
                <div>
                  <span className="font-medium">Email:</span>{" "}
                  {report.users?.email || "No email"}
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🏢 Laboratory
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Lab:</span>{" "}
                  {report.laboratories?.lab_name || "Unknown Lab"}
                </div>
                <div>
                  <span className="font-medium">Location:</span>{" "}
                  {report.laboratories?.location || "No location"}
                </div>
              </div>
            </div>
          </div>

          <ComplaintsSection
            allProcedures={procedures.map(p => ({
              ...p,
              overall_status: complaintsProcs.includes(p.procedure_id) ? "Completed" : "Pending"
            }))}
            workstations={complaintsWorkstations}
            complaints={complaints}
            remarks={editedRemarks.complaintsRemarks}
            onRemarksChange={(value) => setEditedRemarks({...editedRemarks, complaintsRemarks: value})}
            onToggleProcedure={(id, sel) => {
              setComplaintsProcs(prev => sel ? [...new Set([...prev, id])] : prev.filter(p => p !== id));
            }}
            onWorkstationSelect={(workstationId) => {
              const updatedWorkstations = complaintsWorkstations.map(
                (ws: any) =>
                  ws.workstation_id === workstationId
                    ? { ...ws, checked: true }
                    : ws
              );
              setComplaintsWorkstations(updatedWorkstations);
            }}
            onWorkstationDeselect={(workstationId) => {
              const updatedWorkstations = complaintsWorkstations.map(
                (ws: any) =>
                  ws.workstation_id === workstationId
                    ? { ...ws, checked: false }
                    : ws
              );
              setComplaintsWorkstations(updatedWorkstations);
            }}
            onWorkstationSelectAll={() => {
              const updatedWorkstations = complaintsWorkstations.map((ws: any) => ({
                ...ws,
                checked: true,
              }));
              setComplaintsWorkstations(updatedWorkstations);
            }}
            onWorkstationDeselectAll={() => {
              const updatedWorkstations = complaintsWorkstations.map((ws: any) => ({
                ...ws,
                checked: false,
              }));
              setComplaintsWorkstations(updatedWorkstations);
            }}
            isProcedureDropdownOpen={isComplaintsProcedureDropdownOpen}
            onProcedureDropdownToggle={() => setIsComplaintsProcedureDropdownOpen(!isComplaintsProcedureDropdownOpen)}
            procedureSearch={complaintsProcedureSearch}
            onProcedureSearchChange={setComplaintsProcedureSearch}
            isWorkstationDropdownOpen={isComplaintsWorkstationDropdownOpen}
            onWorkstationDropdownToggle={() => setIsComplaintsWorkstationDropdownOpen(!isComplaintsWorkstationDropdownOpen)}
            workstationSearch={complaintsWorkstationSearch}
            onWorkstationSearchChange={setComplaintsWorkstationSearch}
          />

          <FormsSection
            allProcedures={procedures.map(p => ({
              ...p,
              overall_status: formsProcs.includes(p.procedure_id) ? "Completed" : "Pending"
            }))}
            workstations={formsWorkstations}
            softwareInstallations={softwareInstallations}
            remarks={editedRemarks.formsRemarks}
            onRemarksChange={(value) => setEditedRemarks({...editedRemarks, formsRemarks: value})}
            onToggleProcedure={(id, sel) => {
              setFormsProcs(prev => sel ? [...new Set([...prev, id])] : prev.filter(p => p !== id));
            }}
            onWorkstationSelect={(workstationId) => {
              const updatedWorkstations = formsWorkstations.map(
                (ws) =>
                  ws.workstation_id === workstationId
                    ? { ...ws, checked: true }
                    : ws
              );
              setFormsWorkstations(updatedWorkstations);
            }}
            onWorkstationDeselect={(workstationId) => {
              const updatedWorkstations = formsWorkstations.map(
                (ws) =>
                  ws.workstation_id === workstationId
                    ? { ...ws, checked: false }
                    : ws
              );
              setFormsWorkstations(updatedWorkstations);
            }}
            onWorkstationSelectAll={() => {
              const updatedWorkstations = formsWorkstations.map((ws) => ({
                ...ws,
                checked: true,
              }));
              setFormsWorkstations(updatedWorkstations);
            }}
            onWorkstationDeselectAll={() => {
              const updatedWorkstations = formsWorkstations.map((ws) => ({
                ...ws,
                checked: false,
              }));
              setFormsWorkstations(updatedWorkstations);
            }}
            isProcedureDropdownOpen={isFormsProcedureDropdownOpen}
            onProcedureDropdownToggle={() => setIsFormsProcedureDropdownOpen(!isFormsProcedureDropdownOpen)}
            procedureSearch={formsProcedureSearch}
            onProcedureSearchChange={setFormsProcedureSearch}
            isWorkstationDropdownOpen={isFormsWorkstationDropdownOpen}
            onWorkstationDropdownToggle={() => setIsFormsWorkstationDropdownOpen(!isFormsWorkstationDropdownOpen)}
            workstationSearch={formsWorkstationSearch}
            onWorkstationSearchChange={setFormsWorkstationSearch}
          />

          <MaintenanceSection
            allProcedures={procedures.map(p => ({
              ...p,
              overall_status: maintenanceProcs.includes(p.procedure_id) ? "Completed" : "Pending"
            }))}
            workstations={maintenanceWorkstations}
            maintenanceServices={maintenanceServices}
            remarks={editedRemarks.maintenanceRemarks}
            onRemarksChange={(value) => setEditedRemarks({...editedRemarks, maintenanceRemarks: value})}
            onToggleProcedure={(id, sel) => {
              setMaintenanceProcs(prev => sel ? [...new Set([...prev, id])] : prev.filter(p => p !== id));
            }}
            onWorkstationSelect={(workstationId) => {
              const updatedWorkstations = maintenanceWorkstations.map(
                (ws) =>
                  ws.workstation_id === workstationId
                    ? { ...ws, checked: true }
                    : ws
              );
              setMaintenanceWorkstations(updatedWorkstations);
            }}
            onWorkstationDeselect={(workstationId) => {
              const updatedWorkstations = maintenanceWorkstations.map(
                (ws) =>
                  ws.workstation_id === workstationId
                    ? { ...ws, checked: false }
                    : ws
              );
              setMaintenanceWorkstations(updatedWorkstations);
            }}
            onWorkstationSelectAll={() => {
              const updatedWorkstations = maintenanceWorkstations.map((ws) => ({
                ...ws,
                checked: true,
              }));
              setMaintenanceWorkstations(updatedWorkstations);
            }}
            onWorkstationDeselectAll={() => {
              const updatedWorkstations = maintenanceWorkstations.map((ws) => ({
                ...ws,
                checked: false,
              }));
              setMaintenanceWorkstations(updatedWorkstations);
            }}
            isProcedureDropdownOpen={isMaintenanceProcedureDropdownOpen}
            onProcedureDropdownToggle={() => setIsMaintenanceProcedureDropdownOpen(!isMaintenanceProcedureDropdownOpen)}
            procedureSearch={maintenanceProcedureSearch}
            onProcedureSearchChange={setMaintenanceProcedureSearch}
            isWorkstationDropdownOpen={isMaintenanceWorkstationDropdownOpen}
            onWorkstationDropdownToggle={() => setIsMaintenanceWorkstationDropdownOpen(!isMaintenanceWorkstationDropdownOpen)}
            workstationSearch={maintenanceWorkstationSearch}
            onWorkstationSearchChange={setMaintenanceWorkstationSearch}
          />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              onClick={handleCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUnifiedReport;
