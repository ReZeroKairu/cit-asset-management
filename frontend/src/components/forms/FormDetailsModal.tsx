import React, { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { type FormSubmission } from "../../types/forms";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  updateSoftwareInstallDetails,
} from "../../api/forms";
import { X } from "lucide-react";

interface FormDetailsModalProps {
  show: boolean;
  form: FormSubmission | null;
  editMode?: boolean;
  onClose: () => void;
  onUpdateStatus?: (
    formId: number,
    formType: string,
    newStatus: string
  ) => Promise<void>;
  onUpdate?: () => void; // Add callback to refresh data after save
  userRole?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "Custodian_Approved":
      return "bg-blue-100 text-blue-800";
    case "Denied":
      return "bg-red-100 text-red-800";
        case "Completed":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getFormTypeLabel = (type: string | undefined) => {
  if (!type) return "Unknown";
  switch (type) {
    case "software-install":
      return "Software Installation";
    default:
      return type;
  }
};

// Helper function to safely convert values to ReactNode
const toReactNode = (value: unknown): ReactNode => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value as ReactNode;
  }
  // For complex objects, convert to string representation
  return String(value) as ReactNode;
};

  export const FormDetailsModal: React.FC<FormDetailsModalProps> = ({
  show,
  form,
  editMode = false,
  onClose,
  onUpdateStatus,
  onUpdate,
  userRole,
}) => {
  interface EditFormData {
  time_out?: string;
  returned_time?: string;
  remarks?: string;
  installation_remarks?: string;
  printing_pages?: string;
  feedback_date?: string;
}

const [editFormData, setEditFormData] = useState<EditFormData>({
  time_out: "",
  returned_time: "",
  remarks: "",
  installation_remarks: "",
  printing_pages: "",
  feedback_date: ""
});
  const [isInitialized, setIsInitialized] = useState(false);

  
  // Initialize edit form data when entering edit mode
  React.useEffect(() => {
    if (editMode && form && !isInitialized) {
      const initialData = {
        time_out: (form.details.time_out && typeof form.details.time_out === 'string') ? form.details.time_out : "",
        returned_time: (form.details.returned_time && typeof form.details.returned_time === 'string') ? form.details.returned_time : "",
        remarks: (form.details.remarks && typeof form.details.remarks === 'string') ? form.details.remarks : "",
        installation_remarks: (form.details.installation_remarks && typeof form.details.installation_remarks === 'string') ? form.details.installation_remarks : "",
        printing_pages: (form.details.printing_pages && typeof form.details.printing_pages === 'string') ? form.details.printing_pages : "",
        feedback_date: (() => {
          const feedbackDate = form.details.feedback_date;
          if (!feedbackDate) return "";

          if (typeof feedbackDate === "string") {
            if (feedbackDate.includes("T")) {
              const date = new Date(feedbackDate);
              return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD for date input
            } else {
              return feedbackDate; // Return as-is if already in correct format
            }
          } else if (feedbackDate instanceof Date) {
            return feedbackDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD for date input
          }

          return "";
        })(),
      };
      setEditFormData(initialData);
      setIsInitialized(true);
    } else if (!editMode) {
      setEditFormData({
        time_out: "",
        returned_time: "",
        remarks: "",
        installation_remarks: "",
        printing_pages: "",
        feedback_date: ""
      });
      setIsInitialized(false);
    }
  }, [editMode, form, isInitialized]);

  // Add ESC key support
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && show) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [show, onClose]);

  if (!show || !form) {
    return null;
  }

  const canEdit =
    userRole === "Custodian" &&
    form.type === "software-install" &&
    form.status === "Custodian_Approved";
  return (
    <>
      <div
        className="fixed inset-0 backdrop-blur-md bg-black/20 z-99999 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-blue-600 text-white p-6 rounded-t-xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    ⚙️
                  </div>
                  {getFormTypeLabel(form.type)} Details
                </h2>
                <p className="text-blue-100 mt-1">Request ID: #{form.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* Status Bar */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-sm text-gray-500">Status</span>
                  <div
                    className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                      form.status
                    )}`}
                  >
                    {form.status}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Submitted</span>
                  <p className="font-medium">
                    {new Date(form.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {form.type === "software-install" && (
              <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-4 flex items-center gap-2">
                    ⚙️ Software Installation Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <label className="text-xs text-gray-500 uppercase tracking-wide">
                          Faculty Name
                        </label>
                        <p className="font-medium text-gray-900">
                          {form.details.faculty_name}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <label className="text-xs text-gray-500 uppercase tracking-wide">
                          Date
                        </label>
                        <p className="font-medium text-gray-900 uppercase">
                          {toReactNode(form.details?.laboratory || "N/A")}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <label className="text-xs text-gray-500 uppercase tracking-wide">
                          Requested by
                        </label>
                        <p className="font-medium text-gray-900 uppercase">
                          {toReactNode(form.details?.requested_by || "N/A")}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                                            <div className="bg-white p-3 rounded border border-gray-200">
                        <label className="text-xs text-gray-500 uppercase tracking-wide">
                          Prepared by
                        </label>
                        <p className="font-medium text-gray-900 uppercase">
                          {toReactNode(form.details?.prepared_by || "N/A")}
                        </p>
                      </div>
                      {/* Add feedback date field for software installation forms */}
                      {form.type === "software-install" && (
                        <div
                          className={`bg-white p-3 rounded border ${
                            canEdit && editMode
                              ? "border-blue-400 bg-blue-50"
                              : "border-gray-200"
                          }`}
                        >
                          <label className="text-xs text-gray-500 uppercase tracking-wide">
                            Feedback Date
                          </label>
                          {canEdit && editMode ? (
                            <Input
                              type="date"
                              value={editFormData.feedback_date || ""}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  feedback_date: e.target.value,
                                })
                              }
                              className="mt-1 cursor-pointer"
                            />
                          ) : (
                            <p className="font-medium text-gray-900">
                              {(() => {
                                const feedbackDate = form.details.feedback_date;
                                if (!feedbackDate) return "";

                                if (typeof feedbackDate === "string") {
                                  if (feedbackDate.includes("T")) {
                                    const date = new Date(feedbackDate);
                                    return date.toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                    });
                                  } else {
                                    return feedbackDate; // Return as-is if no T
                                  }
                                } else if (feedbackDate instanceof Date) {
                                  return feedbackDate.toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                    }
                                  );
                                }

                                return "";
                              })()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {form.details.software_list && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h4 className="font-medium text-indigo-900 mb-2">
                      Software List
                    </h4>
                    <p className="text-gray-700">
                      {form.details.software_list as string}
                    </p>
                  </div>
                )}

                {canEdit && editMode && (
                  <div
                    className={`bg-gray-50 border rounded-lg p-4 ${
                      canEdit && editMode
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <h4 className="font-medium text-gray-900 mb-2">
                      Installation Remarks
                    </h4>
                    <Textarea
                      value={editFormData.installation_remarks || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          installation_remarks: e.target.value,
                        })
                      }
                      placeholder="Add installation feedback and remarks"
                      rows={3}
                    />
                  </div>
                )}

                {!editMode && form.details.installation_remarks && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Installation Remarks
                    </h4>
                    <p className="text-gray-700">
                      {form.details.installation_remarks as string}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Edit Action Buttons - Fixed at bottom */}
          {editMode && (
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={async () => {
                    if (onUpdateStatus && form) {
                      try {
                        // Create the update data based on form type
                        const updateData: any = {};

                        // Always update remarks if provided
                        if (editFormData.remarks !== undefined) {
                          updateData.remarks = editFormData.remarks;
                        }

                        // Always update installation_remarks if provided (for software install forms)
                        if (editFormData.installation_remarks !== undefined) {
                          updateData.installation_remarks =
                            editFormData.installation_remarks;
                        }

                        // Always update feedback_date if provided (for software install forms)
                        if (editFormData.feedback_date !== undefined) {
                          updateData.feedback_date = editFormData.feedback_date;
                        }

                        // Call the appropriate API function based on form type
                        if (form.type === "software-install") {
                          await updateSoftwareInstallDetails(
                            form.id,
                            updateData
                          );
                        }

                        alert("Form updated successfully!");

                        // Call onUpdate to refresh the parent component's data
                        if (onUpdate) {
                          onUpdate();
                        }

                        // Close the modal and reset edit mode
                        if (onClose) {
                          onClose();
                        }
                      } catch (error) {
                        console.error("Error updating form:", error);
                        alert("Error updating form. Please try again.");
                      }
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FormDetailsModal;
