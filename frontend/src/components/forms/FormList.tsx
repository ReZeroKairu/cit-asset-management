import React from "react";
import { type FormSubmission } from "../../types/forms";
import { format } from "date-fns";
import { Download, Edit } from "lucide-react";
import { generateFormDocument } from "../../utils/formTemplateMapping";
import { Button } from "../ui/button";

interface FormListProps {
  forms: FormSubmission[];
  loading: boolean;
  onViewDetails: (form: FormSubmission) => void;
  getStatusColor: (status: string) => string;
  getFormTypeLabel: (type: string) => string;
  onUpdateStatus: (
    formId: number,
    formType: string,
    newStatus: string
  ) => Promise<void>;
  userRole: string;
  selectedForms?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onBulkApprove?: () => void;
  onEditForm?: (form: FormSubmission) => void;
}

export const FormList: React.FC<FormListProps> = ({
  forms,
  loading,
  onViewDetails,
  getStatusColor,
  getFormTypeLabel,
  onUpdateStatus,
  userRole,
  selectedForms = new Set(),
  onSelectionChange = () => {},
  onBulkApprove = () => {},
  onEditForm = () => {},
}) => {

  const handleCheckboxChange = (formId: string, checked: boolean) => {
    const newSelected = new Set(selectedForms);
    if (checked) {
      newSelected.add(formId);
    } else {
      newSelected.delete(formId);
    }
    onSelectionChange?.(newSelected);
  };

  const handleGenerateForm = async (form: FormSubmission) => {
    try {
      await generateFormDocument(form);
    } catch (error) {
      console.error("Error generating form:", error);
      alert("Failed to generate form document. Please try again.");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allApprovableForms = forms
        .filter(
          (form) => userRole === "Admin" && form.status === "Custodian_Approved"
        )
        .map((form) => `${form.type}-${form.id}`);
      onSelectionChange?.(new Set(allApprovableForms));
    } else {
      onSelectionChange?.(new Set());
    }
  };

  const approvableForms = forms.filter(
    (form) => userRole === "Admin" && form.status === "Custodian_Approved"
  );
  const allSelected =
    approvableForms.length > 0 &&
    approvableForms.every((form) =>
      selectedForms.has(`${form.type}-${form.id}`)
    );

  // ── Shared styles ──────────────────────────────────────────────────────────

  const iconBtn =
    "p-0 h-7 w-7 flex items-center justify-center rounded-md " +
    "bg-transparent shadow-none cursor-pointer transition-colors";

  const statusBtn =
    "inline-flex items-center h-7 px-2.5 rounded-md text-[11px] font-semibold " +
    "cursor-pointer border-none text-white whitespace-nowrap transition-all " +
    "hover:brightness-90 active:scale-95";

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
        Loading...
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
        No forms found matching the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk select bar */}
      {userRole === "Admin" && approvableForms.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-pointer checked:bg-blue-600 checked:border-blue-600"
            />
            <span className="text-xs font-medium text-gray-600">
              {allSelected ? "Deselect All" : "Select All"}{" "}
              <span className="text-gray-400">
                ({selectedForms.size} selected)
              </span>
            </span>
          </div>
          {selectedForms.size > 0 && (
            <Button
              onClick={onBulkApprove}
              className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs"
              size="sm"
            >
              Approve Selected ({selectedForms.size})
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
        <table
          className="w-full divide-y divide-gray-200"
          style={{ minWidth: "700px" }}
        >
          <thead className="bg-gray-50">
            <tr>
              {userRole === "Admin" && approvableForms.length > 0 && (
                <th
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ width: "48px" }}
                />
              )}
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                style={{ width: "150px" }}
              >
                Form type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User details
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                style={{ width: "160px" }}
              >
                Status
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                style={{ width: "130px" }}
              >
                Submitted
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                style={{ width: "200px" }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {forms.map((form) => {
              const formId = `${form.type}-${form.id}`;
              const isApprovable =
                userRole === "Admin" && form.status === "Custodian_Approved";
              const isSelected = selectedForms.has(formId);

              const showEdit =
                form.type === "software-install" &&
                form.status === "Custodian_Approved";
              const showDownload = userRole !== "Admin";

              // Only show divider when there are icon slots visible
              const showIconSlots = showEdit || showDownload;

              return (
                <tr
                  key={formId}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.tagName === "INPUT") return;
                    onViewDetails(form);
                  }}
                >
                  {/* Checkbox */}
                  {userRole === "Admin" && approvableForms.length > 0 && (
                    <td className="px-3 py-3 align-middle">
                      {isApprovable && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) =>
                              handleCheckboxChange(formId, e.target.checked)
                            }
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-pointer checked:bg-blue-600 checked:border-blue-600"
                          />
                        </div>
                      )}
                    </td>
                  )}

                  {/* Form type */}
                  <td className="px-4 py-3 align-middle">
                    <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      {getFormTypeLabel(form.type)}
                    </p>
                    {form.purpose && (
                      <p
                        className="text-xs text-gray-400 mt-0.5 truncate"
                        style={{ maxWidth: "130px" }}
                        title={form.purpose}
                      >
                        {form.purpose}
                      </p>
                    )}
                  </td>

                  {/* User details */}
                  <td className="px-4 py-3 align-middle">
                    <p
                      className="text-sm font-medium text-gray-900 truncate"
                      style={{ maxWidth: "200px" }}
                      title={form.name}
                    >
                      {form.name}
                    </p>
                    <p
                      className="text-xs text-gray-400 mt-0.5 truncate"
                      style={{ maxWidth: "200px" }}
                    >
                      {form.laboratory && (
                        <span>{form.laboratory}</span>
                      )}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 align-middle text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(
                        form.status
                      )}`}
                    >
                      {form.status.replace("_", " ")}
                    </span>
                  </td>

                  {/* Submitted */}
                  <td className="px-4 py-3 align-middle text-center">
                    <p className="text-xs text-gray-600 whitespace-nowrap">
                      {format(
                        new Date(form.createdAt || form.date),
                        "M/d/yyyy"
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">
                      {format(new Date(form.createdAt || form.date), "h:mm a")}
                    </p>
                  </td>

                  {/* Actions */}
                  <td
                    className="px-4 py-3 align-middle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {/* Slots 1 & 2 — Edit + Download (only rendered for non-Admin) */}
                      {showIconSlots && (
                        <>
                          {/* Slot 1 — Edit */}
                          <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                            {showEdit ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onEditForm(form)}
                                className={`${iconBtn} text-blue-600 hover:bg-blue-50`}
                                title="Edit Installation Details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                            ) : (
                              <span className="w-7 h-7 shrink-0" />
                            )}
                          </div>

                          {/* Slot 2 — Download */}
                          <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                            {showDownload ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleGenerateForm(form)}
                                className={`${iconBtn} text-green-600 hover:bg-green-50`}
                                title="Generate Form Document"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                            ) : (
                              <span className="w-7 h-7 shrink-0" />
                            )}
                          </div>

                          {/* Divider — only when icon slots are present */}
                          <span className="w-px h-4 bg-gray-200 mx-1 shrink-0" />
                        </>
                      )}

                      {/* Slot 3 — Status buttons */}
                      <div className="flex items-center gap-1">
                        {userRole === "Admin" &&
                          form.status === "Custodian_Approved" && (
                            <>
                              <button
                                className={`${statusBtn} bg-green-600 hover:bg-green-700`}
                                onClick={() =>
                                  onUpdateStatus(
                                    form.id,
                                    form.type,
                                    "Custodian_Approved"
                                  )
                                }
                              >
                                Approve
                              </button>
                              <button
                                className={`${statusBtn} bg-red-600 hover:bg-red-700`}
                                onClick={() =>
                                  onUpdateStatus(form.id, form.type, "Denied")
                                }
                              >
                                Deny
                              </button>
                            </>
                          )}

                        {form.type === "software-install" &&
                          form.status === "Custodian_Approved" && (
                            <button
                              className={`${statusBtn} bg-green-600 hover:bg-green-700`}
                              onClick={() => {
                                const installationRemarks =
                                  form.details.installation_remarks;
                                const feedbackDate = form.details.feedback_date;
                                if (!installationRemarks || !feedbackDate) {
                                  const missingFields = [];
                                  if (!installationRemarks)
                                    missingFields.push("Installation Remarks");
                                  if (!feedbackDate)
                                    missingFields.push("Feedback Date");
                                  alert(
                                    `Please fill in the following required fields before marking as completed:\n\n${missingFields.join(
                                      "\n"
                                    )}\n\nClick "Edit" to update form details.`
                                  );
                                  return;
                                }
                                onUpdateStatus(form.id, form.type, "Completed");
                              }}
                            >
                              Completed
                            </button>
                          )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
