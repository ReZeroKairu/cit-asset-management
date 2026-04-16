import React from "react";
import { Download, Edit } from "lucide-react";
import { type FormSubmission } from "../../types/forms";

interface FormActionsProps {
  form: FormSubmission;
  userRole?: string;
  onUpdateStatus: (formId: number, formType: string, newStatus: string) => Promise<void>;
  onEditForm?: (form: FormSubmission) => void;
  onDownloadForm?: (form: FormSubmission) => void;
}

export const FormActions: React.FC<FormActionsProps> = ({
  form,
  userRole,
  onUpdateStatus,
  onEditForm,
  onDownloadForm,
}) => {
  const handleStatusUpdate = (newStatus: string) => {
    onUpdateStatus(form.id, form.type, newStatus);
  };

  const validateRequiredFields = (missingFields: string[]) => {
    if (missingFields.length > 0) {
      alert(
        `Please fill in the following required fields before marking as completed:\n\n${missingFields.join("\n")}\n\nClick "Edit" to update form details.`
      );
      return false;
    }
    return true;
  };

  
  
  const handleSoftwareComplete = () => {
    const missingFields = [];
    if (!form.details.installation_remarks) missingFields.push("Installation Remarks");
    if (!form.details.feedback_date) missingFields.push("Feedback Date");
    if (validateRequiredFields(missingFields)) handleStatusUpdate("Completed");
  };

  // ── Flags ──────────────────────────────────────────────────────────────────

  const showEdit =
    userRole === "Custodian" &&
    form.type === "software-install" &&
    form.status === "Custodian_Approved";

  const showDownload = userRole === "Custodian" && !!onDownloadForm;

  const showApprove =
    form.status === "Pending" &&
    !(userRole === "Admin" && form.type === "software-install");

  const showSoftComplete = form.type === "software-install" && form.status === "Custodian_Approved";

  // ── Shared styles ──────────────────────────────────────────────────

  const statusBtn =
    "inline-flex items-center h-7 px-2.5 rounded-md text-[11px] font-semibold " +
    "cursor-pointer border-none text-white whitespace-nowrap transition-all " +
    "hover:brightness-90 active:scale-95";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex items-center justify-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Slot 1 — Edit (fixed, always reserves 28px) */}
      <div className="w-7 h-7 shrink-0 flex items-center justify-center">
        {showEdit ? (
          <button
            className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors cursor-pointer"
            onClick={() => onEditForm?.(form)}
            title="Edit Form Details"
          >
            <Edit className="w-4 h-4 transition-transform hover:scale-105" />
          </button>
        ) : (
          <span className="w-7 h-7 shrink-0" />
        )}
      </div>

      {/* Slot 2 — Download (fixed, always reserves 28px) */}
      <div className="w-7 h-7 shrink-0 flex items-center justify-center">
        {showDownload ? (
          <button
            className="text-green-600 hover:text-green-800 p-1 rounded transition-colors cursor-pointer"
            onClick={() => onDownloadForm!(form)}
            title="Generate Form Document"
          >
            <Download className="w-4 h-4 transition-transform hover:scale-105" />
          </button>
        ) : (
          <span className="w-7 h-7 shrink-0" />
        )}
      </div>

      {/* Divider — always rendered to keep column width stable */}
      <span className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

      {/* Slot 3 — Status buttons (min-width keeps column stable) */}
      <div className="flex items-center gap-1 min-w-[120px]">
        {showApprove && (
          <>
            <button
              className={`${statusBtn} bg-green-600 hover:bg-green-700`}
              onClick={() => handleStatusUpdate("Custodian_Approved")}
            >
              Approve
            </button>
            <button
              className={`${statusBtn} bg-red-600 hover:bg-red-700`}
              onClick={() => handleStatusUpdate("Denied")}
            >
              Deny
            </button>
          </>
        )}

        
        {showSoftComplete && (
          <button
            className={`${statusBtn} bg-green-600 hover:bg-green-700`}
            onClick={handleSoftwareComplete}
          >
            Completed
          </button>
        )}
      </div>
    </div>
  );
};