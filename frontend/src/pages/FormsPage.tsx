import React, { useState, useCallback } from "react";
import { useAuth, type users_role } from "../context/AuthContext";
import { FormDetailsModal } from "../components/forms/FormDetailsModal";
import QRCodeModal from "../components/QRCodeModal";
import { StatusFilter } from "../components/forms/StatusFilter";
import { FormList } from "../components/forms/FormList";
import { LabRequestForm } from "../components/forms/LabRequestForm";
import { EquipmentBorrowForm } from "../components/forms/EquipmentBorrowForm";
import { SoftwareInstallForm } from "../components/forms/SoftwareInstallForm";
import { FileText } from "lucide-react";
import { FormActions } from "../components/forms/FormActions";
import { generateFormDocument } from "../utils/formTemplateMapping";
import QRCodeGenerator from "../components/QRCodeGenerator";
import { useFormsData } from "../hooks/useFormsData";
import { useFormStatus } from "../hooks/useFormStatus";
import { useFormFiltering } from "../hooks/useFormFiltering";
import { getFormStatusColor } from "../utils/statusUtils";
import { formatUserType, formatUsageType, formatLaboratory } from "../utils/formatUtils";
import { type FormSubmission } from "../types/forms";

// ─── Submitted Forms Table ────────────────────────────────────────────────────

interface SubmittedFormsTableProps {
  forms: FormSubmission[];
  loading: boolean;
  userRole: users_role | undefined;
  onRowClick: (form: FormSubmission) => void;
  onUpdateStatus: (formId: number, formType: string, newStatus: string) => Promise<void>;
  onEditForm: (form: FormSubmission) => void;
  onDownloadForm: (form: FormSubmission) => void;
  getStatusColor: (status: string) => string;
}

const getFormTypeLabel = (type: string) => {
  switch (type) {
    case "lab-request":       return "Lab Request";
    case "equipment-borrow":  return "Equipment Borrow";
    case "software-install":  return "Software Install";
    default:                  return type;
  }
};

const FormMetaLine = ({ form }: { form: FormSubmission }) => {
  if (form.type === "lab-request") {
    return (
      <>
        {form.details?.user_type && (
          <span className="capitalize">{formatUserType(form.details.user_type)}</span>
        )}
        {form.details?.usage_type && (
          <span> &bull; {formatUsageType(form.details.usage_type)}</span>
        )}
        {form.laboratory && (
          <span> &bull; {formatLaboratory(form.laboratory)}</span>
        )}
      </>
    );
  }

  if (form.type === "equipment-borrow" || form.type === "software-install") {
    return (
      <>
        {form.details?.user_type && (
          <span className="capitalize">{formatUserType(form.details.user_type)}</span>
        )}
        {form.laboratory && (
          <span>{form.details?.user_type ? " \u2022 " : ""}{formatLaboratory(form.laboratory)}</span>
        )}
      </>
    );
  }

  return form.laboratory ? <span>{formatLaboratory(form.laboratory)}</span> : null;
};

const SubmittedFormsTable = ({
  forms,
  loading,
  userRole,
  onRowClick,
  onUpdateStatus,
  onEditForm,
  onDownloadForm,
  getStatusColor,
}: SubmittedFormsTableProps) => {
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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
      <table className="w-full divide-y divide-gray-200" style={{ minWidth: "680px" }}>
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              style={{ width: "150px" }}
            >
              Form Type
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              User Details
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              style={{ width: "115px" }}
            >
              Status
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              style={{ width: "140px" }}
            >
              Submitted
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              style={{ width: "110px" }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {forms.map((form) => (
            <tr
              key={`${form.type}-${form.id}`}
              className="hover:bg-blue-50 cursor-pointer transition-colors"
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === "INPUT" || target.tagName === "BUTTON") return;
                onRowClick(form);
              }}
            >
              {/* Form Type */}
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

              {/* User Details */}
              <td className="px-4 py-3 align-middle">
                <p
                  className="text-sm font-medium text-gray-900 truncate"
                  style={{ maxWidth: "220px" }}
                  title={form.name}
                >
                  {form.name}
                </p>
                <p
                  className="text-xs text-gray-400 mt-0.5 truncate"
                  style={{ maxWidth: "220px" }}
                >
                  <FormMetaLine form={form} />
                </p>
              </td>

              {/* Status */}
              <td className="px-4 py-3 align-middle text-center">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(form.status)}`}
                >
                  {form.status.replace(/_/g, " ")}
                </span>
              </td>

              {/* Submitted */}
              <td className="px-4 py-3 align-middle text-center">
                <p className="text-xs text-gray-600 whitespace-nowrap">
                  {new Date(form.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">
                  {new Date(form.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </td>

              {/* Actions */}
              <td
                className="px-4 py-3 align-middle"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-center gap-1">
                  <FormActions
                    form={form}
                    userRole={userRole}
                    onUpdateStatus={onUpdateStatus}
                    onEditForm={onEditForm}
                    onDownloadForm={onDownloadForm}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Tab Nav ──────────────────────────────────────────────────────────────────

const TAB_ITEMS = [
  { id: "submitted",        label: "Submitted Forms"    },
  { id: "lab-request",      label: "Lab Request"        },
  { id: "equipment-borrow", label: "Equipment Borrow"   },
  { id: "software-install", label: "Software Install"   },
] as const;

type TabId = (typeof TAB_ITEMS)[number]["id"] | "qr-code";

// ─── Page ─────────────────────────────────────────────────────────────────────

const FormsPage = () => {
  const { user } = useAuth();
  const { forms, loading, refetchForms } = useFormsData();
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set());
  const { updateStatus, handleBulkApprove } = useFormStatus(refetchForms, selectedForms);
  const { filter, setDateFilter, filteredForms, pendingCount, handleFilterChange } =
    useFormFiltering(forms);

  const [showDetails, setShowDetails] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormSubmission | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("submitted");
  const [showQRModal, setShowQRModal] = useState(false);

  const handleViewDetails = useCallback((form: FormSubmission) => {
    setSelectedForm(form);
    setShowDetails(true);
    setEditMode(false);
  }, []);

  const handleEditForm = useCallback((form: FormSubmission) => {
    setSelectedForm(form);
    setEditMode(true);
    setShowDetails(true);
  }, []);

  const handleDownloadForm = useCallback((form: FormSubmission) => {
    try {
      generateFormDocument(form);
    } catch (error) {
      console.error("Error downloading form:", error);
    }
  }, []);

  const closeDetails = useCallback(() => {
    setShowDetails(false);
    setEditMode(false);
  }, []);

  // ── Non-admin view ──────────────────────────────────────────────────────────

  if (user?.role !== ("Admin" as users_role)) {
    const tabs = [
      ...TAB_ITEMS,
      ...(user?.role === "Custodian"
        ? [{ id: "qr-code" as const, label: "QR Code" }]
        : []),
    ];

    return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
          <p className="text-gray-600 mt-1">
            Submit your requests for laboratory usage, equipment borrowing, and
            software installation.
          </p>
        </div>

        {/* Filters */}
        <StatusFilter
          value={filter}
          onChange={handleFilterChange}
          pendingCount={pendingCount}
          userRole={user?.role}
          onDateFilterChange={setDateFilter}
        />

        {/* Tab navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap gap-x-6 gap-y-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <FileText className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === "submitted" && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-gray-800">Submitted Forms</h2>
            <SubmittedFormsTable
              forms={filteredForms}
              loading={loading}
              userRole={user?.role}
              onRowClick={(form) => {
                setSelectedForm(form);
                setShowDetails(true);
              }}
              onUpdateStatus={updateStatus}
              onEditForm={handleEditForm}
              onDownloadForm={handleDownloadForm}
              getStatusColor={getFormStatusColor} 
            />
          </div>
        )}

        {activeTab === "lab-request" && (
          <div className="space-y-6">
            <h2 className="text-base font-semibold text-gray-800">Lab Request Form</h2>
            <LabRequestForm />
          </div>
        )}

        {activeTab === "equipment-borrow" && (
          <div className="space-y-6">
            <h2 className="text-base font-semibold text-gray-800">Equipment Borrow Form</h2>
            <EquipmentBorrowForm />
          </div>
        )}

        {activeTab === "software-install" && (
          <div className="space-y-6">
            <h2 className="text-base font-semibold text-gray-800">Software Installation Form</h2>
            <SoftwareInstallForm />
          </div>
        )}

        {activeTab === "qr-code" && user?.role === "Custodian" && (
          <QRCodeGenerator />
        )}

        {selectedForm && (
          <FormDetailsModal
            show={showDetails}
            form={selectedForm}
            editMode={editMode}
            onClose={closeDetails}
            onUpdateStatus={updateStatus}
            onUpdate={refetchForms}
            userRole={user?.role}
          />
        )}
      </div>
    );
  }

  // ── Admin view ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Form Approval</h1>
        <p className="text-gray-600 mt-1">
          Review and approve form submissions from students and faculty.
        </p>
      </div>

      <StatusFilter
        value={filter}
        onChange={handleFilterChange}
        pendingCount={pendingCount}
        userRole={user?.role}
        onDateFilterChange={setDateFilter}
      />

      <FormList
        forms={filteredForms}
        loading={loading}
        onViewDetails={handleViewDetails}
        getStatusColor={getFormStatusColor}
        getFormTypeLabel={getFormTypeLabel}
        onUpdateStatus={updateStatus}
        userRole={user?.role}
        selectedForms={selectedForms}
        onSelectionChange={setSelectedForms}
        onBulkApprove={handleBulkApprove}
        onEditForm={handleEditForm}
      />

      {selectedForm && (
        <FormDetailsModal
          show={showDetails}
          form={selectedForm}
          editMode={editMode}
          onClose={closeDetails}
          onUpdateStatus={updateStatus}
          onUpdate={refetchForms}
          userRole={user?.role}
        />
      )}

      {user?.role === "Custodian" && (
        <QRCodeModal
          show={showQRModal}
          onClose={() => setShowQRModal(false)}
          baseUrl={window.location.origin}
        />
      )}
    </div>
  );
};

export default FormsPage;