import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth, type users_role } from "../context/AuthContext";
import {
  getLabRequests,
  getEquipmentBorrows,
  getSoftwareInstallations,
  getOneTimeFormSubmissionsNoAuth,
  updateLabRequestStatus as apiUpdateLabRequestStatus,
  updateEquipmentBorrowStatus as apiUpdateEquipmentBorrowStatus,
  updateSoftwareInstallationStatus as apiUpdateSoftwareInstallationStatus,
} from "../api/forms";
import { FormDetailsModal } from "../components/forms/FormDetailsModal";
import QRCodeModal from "../components/QRCodeModal";
import { StatusFilter } from "../components/forms/StatusFilter";
import { FormList } from "../components/forms/FormList";
import { LabRequestForm } from "../components/forms/LabRequestForm";
import { EquipmentBorrowForm } from "../components/forms/EquipmentBorrowForm";
import { SoftwareInstallForm } from "../components/forms/SoftwareInstallForm";
import {
  Download,
  Edit,
  Eye,
  Clock,
  QrCode,
  FileText,
  Users,
} from "lucide-react";
import { generateFormDocument } from "../utils/formTemplateMapping";
import QRCodeGenerator from "../components/QRCodeGenerator";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { type FormSubmission } from "../types/forms";

const FormsPage = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormSubmission | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("submitted");
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set());

  useEffect(() => {
    console.log("useEffect triggered - user:", user);
    if (user) {
      console.log("User exists, calling fetchForms");
      fetchForms();
    } else {
      console.log("No user, skipping fetchForms");
    }
  }, [user]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      console.log("Fetching forms for user:", user);

      const [
        labRequests,
        equipmentBorrows,
        softwareInstallations,
        oneTimeSubmissions,
      ] = await Promise.all([
        getLabRequests({}),
        getEquipmentBorrows({}),
        getSoftwareInstallations({}),
        getOneTimeFormSubmissionsNoAuth(),
      ]);

      console.log("API Responses:", {
        labRequests,
        equipmentBorrows,
        softwareInstallations,
        oneTimeSubmissions,
      });

      const labRequestsData = Array.isArray(labRequests)
        ? labRequests
        : labRequests?.data || [];
      const equipmentBorrowsData = Array.isArray(equipmentBorrows)
        ? equipmentBorrows
        : equipmentBorrows?.data || [];
      const softwareInstallationsData = Array.isArray(softwareInstallations)
        ? softwareInstallations
        : softwareInstallations?.data || [];
      const oneTimeSubmissionsData = Array.isArray(oneTimeSubmissions)
        ? oneTimeSubmissions
        : [];

      console.log("🔍 FormsPage - Current user:", {
        user: user,
        userId: user?.id,
        userIdType: typeof user?.id,
        userRole: user?.role,
      });

      const allForms: FormSubmission[] = [
        ...labRequestsData.map((req: any) => ({
          id: req.request_id,
          type: "lab-request" as const,
          date: req.date,
          name: req.faculty_student_name,
          status: req.status,
          laboratory: req.laboratory,
          purpose: req.purpose,
          createdAt: req.created_at,
          userId: req.user_id ?? req.users?.id,
          details: req,
        })),
        ...equipmentBorrowsData.map((borrow: any) => ({
          id: borrow.borrow_id,
          type: "equipment-borrow" as const,
          date: borrow.date,
          name: borrow.faculty_student_name,
          status: borrow.status,
          laboratory: borrow.laboratory,
          purpose: borrow.purpose,
          createdAt: borrow.created_at,
          userId: borrow.user_id ?? borrow.users?.id,
          details: borrow,
        })),
        ...softwareInstallationsData.map((install: any) => ({
          id: install.id,
          type: "software-install" as const,
          date: install.date,
          name: install.faculty_name,
          status: install.status,
          laboratory: install.laboratory,
          purpose: install.software_list,
          createdAt: install.created_at,
          userId: install.user_id ?? install.users?.id,
          details: install,
        })),
        ...oneTimeSubmissionsData.map((submission: any) => ({
          id: submission.formId || submission.id,
          type: submission.formType,
          date: submission.date || new Date().toISOString().split("T")[0],
          name:
            submission.faculty_student_name ||
            submission.faculty_name ||
            "One-Time Form User",
          status: submission.status || "Pending",
          laboratory: submission.laboratory || "",
          purpose: submission.purpose || submission.software_list || "",
          createdAt: submission.created_at || new Date().toISOString(),
          userId: submission.user_id,
          details: submission,
        })),
      ];

      const userForms = (() => {
        if (user?.role === "Admin") {
          // Admin sees all forms except software-install (handled by custodians only) and archived forms
          return allForms.filter(
            (form) =>
              form.status === "Custodian_Approved" &&
              form.type !== "software-install", // Exclude software installation forms
          );
        }

        if (user?.role === ("Custodian" as users_role)) {
          return allForms
            .filter(
              (form) =>
                // Only show forms that this custodian created or is directly responsible for
                form.userId === user?.id ||
                (form.details?.submittedVia === "one-time-token" &&
                  form.details?.userId === user?.id),
            )
            .filter(
              (form) =>
                // Exclude archived forms (completed, returned, denied)
                form.status !== "Completed" &&
                form.status !== "Returned" &&
                form.status !== "Denied",
            );
        }

        return allForms.filter((form) => form.status === "Pending");
      })();

      setForms(
        userForms.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = useCallback(
    async (formId: number, formType: string, newStatus: string) => {
      try {
        console.log(
          `Updating status for ${formType} ${formId} to ${newStatus}`,
        );

        switch (formType) {
          case "lab-request":
            await apiUpdateLabRequestStatus(formId, newStatus);
            break;
          case "equipment-borrow":
            await apiUpdateEquipmentBorrowStatus(formId, newStatus);
            break;
          case "software-install":
            await apiUpdateSoftwareInstallationStatus(formId, newStatus);
            break;
          default:
            console.error("Unknown form type:", formType);
            return;
        }

        console.log("Status update successful, refreshing forms...");
        await fetchForms();
      } catch (error) {
        console.error("Error updating status:", error);
      }
    },
    [fetchForms],
  );

  const handleBulkApprove = useCallback(async () => {
    if (selectedForms.size === 0) return;

    try {
      console.log(`Bulk approving ${selectedForms.size} forms`);

      const approvalPromises = Array.from(selectedForms).map((formIdStr) => {
        const [formType, idStr] = formIdStr.split("-");
        const formId = parseInt(idStr);

        // Skip software-install forms - they are handled by custodians only
        if (formType === "software-install") {
          console.log(
            "Skipping software-install form - handled by custodians only",
          );
          return Promise.resolve();
        }

        switch (formType) {
          case "lab-request":
            return apiUpdateLabRequestStatus(formId, "Admin_Approved");
          case "equipment-borrow":
            return apiUpdateEquipmentBorrowStatus(formId, "Admin_Approved");
          default:
            console.error("Unknown form type:", formType);
            return Promise.resolve();
        }
      });

      await Promise.all(approvalPromises);
      console.log(
        "Bulk approval successful, clearing selection and refreshing forms...",
      );

      setSelectedForms(new Set());
      await fetchForms();
    } catch (error) {
      console.error("Error during bulk approval:", error);
    }
  }, [selectedForms, fetchForms]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Custodian_Approved":
      case "Admin_Approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Denied":
        return "bg-red-100 text-red-800 border-red-200";
      case "Returned":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Completed":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }, []);

  const getFormTypeLabel = (type: string) => {
    switch (type) {
      case "lab-request":
        return "Lab Request";
      case "equipment-borrow":
        return "Equipment Borrow";
      case "software-install":
        return "Software Installation";
      default:
        return type;
    }
  };

  const filterByDate = useCallback(
    (form: FormSubmission) => {
      if (dateFilter === "all") return true;

      const formDate = new Date(form.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      switch (dateFilter) {
        case "today":
          return formDate >= today;
        case "yesterday":
          return formDate >= yesterday && formDate < today;
        case "last7days":
          return formDate >= lastWeek;
        case "last30days":
          return formDate >= lastMonth;
        default:
          return true;
      }
    },
    [dateFilter],
  );

  const handleViewDetails = useCallback((form: FormSubmission) => {
    console.log("View details clicked:", form);
    setSelectedForm(form);
    setShowDetails(true);
    setEditMode(false);
  }, []);

  const handleEditForm = useCallback((form: FormSubmission) => {
    console.log("Edit form clicked:", form);
    setSelectedForm(form);
    setShowDetails(true);
    setEditMode(true);
  }, []);

  const { filteredForms, pendingCount } = useMemo(() => {
    const filtered = forms.filter((form) => {
      const matchesStatus = filter === "all" || form.status === filter;
      const matchesDate = filterByDate(form);
      return matchesStatus && matchesDate;
    });

    return {
      filteredForms: filtered,
      pendingCount: forms.filter(
        (f) => f.status === "Pending" && filterByDate(f),
      ).length,
    };
  }, [forms, filter, filterByDate]);

  if (user?.role !== "Admin") {
    return (
      <div className="space-y-6 p-6">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
              <p className="text-gray-600">
                Submit your requests for laboratory usage, equipment borrowing,
                and software installation
              </p>
            </div>
          </div>
        </div>

        {/* Add StatusFilter for Custodian users */}
        <StatusFilter
          value={filter}
          onChange={setFilter}
          pendingCount={pendingCount}
          userRole={user?.role}
          onDateFilterChange={setDateFilter}
        />

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap sm:flex sm:space-x-8 gap-2 sm:gap-0">
            <button
              className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap ${
                activeTab === "submitted"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("submitted")}
            >
              <FileText className="w-4 h-4" />
              Form Submitted
            </button>
            <button
              className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap ${
                activeTab === "lab-request"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("lab-request")}
            >
              <FileText className="w-4 h-4" />
              Lab Request
            </button>
            <button
              className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap ${
                activeTab === "equipment-borrow"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("equipment-borrow")}
            >
              <FileText className="w-4 h-4" />
              Equipment Borrow
            </button>
            <button
              className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap ${
                activeTab === "software-install"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("software-install")}
            >
              <FileText className="w-4 h-4" />
              Software Install
            </button>
            {user?.role === ("Custodian" as users_role) && (
              <button
                className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "qr-code"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("qr-code")}
              >
                <QrCode className="w-4 h-4" />
                QR Code
              </button>
            )}
          </nav>
        </div>

        {activeTab === "submitted" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Submitted Forms</h2>
            {loading ? (
              <div>Loading...</div>
            ) : forms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No submitted forms found. Forms submitted via your QR codes will
                appear here.
              </div>
            ) : (
              forms.map((form) => (
                <Card
                  key={`${form.type}-${form.id}`}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {getFormTypeLabel(form.type)}
                          </h3>
                          <Badge className={getStatusColor(form.status)}>
                            {form.status}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-1">{form.purpose}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {form.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(form.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Submitted: {new Date(form.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            console.log("View button clicked, form:", form);
                            console.log("Form details:", form.details);
                            setSelectedForm(form);
                            setShowDetails(true);
                            console.log(
                              "After setting state - selectedForm:",
                              form,
                              "showDetails:",
                              true,
                            );
                          }}
                          className="p-2 h-8 w-8 cursor-pointer hover:bg-gray-100 rounded-md"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {user?.role === "Custodian" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              console.log(
                                "Generate button clicked, form:",
                                form,
                              );
                              generateFormDocument(form);
                            }}
                            className="p-2 h-8 w-8 cursor-pointer hover:bg-gray-100 rounded-md"
                            title="Generate Form Document"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}

                        {user?.role === "Custodian" &&
                          form.status === "Admin_Approved" && (
                            <Button
                              size="sm"
                              className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer p-2 h-8 w-8"
                              onClick={() => {
                                console.log("Edit button clicked, form:", form);
                                setSelectedForm(form);
                                setEditMode(true);
                                setShowDetails(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}

                        {form.status === "Pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                updateStatus(
                                  form.id,
                                  form.type,
                                  "Custodian_Approved",
                                );
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                              onClick={() => {
                                updateStatus(form.id, form.type, "Denied");
                              }}
                            >
                              Deny
                            </Button>
                          </div>
                        )}
                        {form.type === "equipment-borrow" &&
                          form.status === "Admin_Approved" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                // Check if required fields are filled before marking returned
                                const returnedTime = form.details.returned_time;
                                const remarks = form.details.remarks;

                                if (!returnedTime || !remarks) {
                                  const missingFields = [];
                                  if (!returnedTime)
                                    missingFields.push("Returned Time");
                                  if (!remarks) missingFields.push("Remarks");

                                  alert(
                                    `Please fill in the following required fields before marking as returned:\n\n${missingFields.join("\n")}\n\nClick "Edit" to update form details.`,
                                  );
                                  return;
                                }

                                updateStatus(form.id, form.type, "Returned");
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                            >
                              Returned
                            </Button>
                          )}

                        {/* Software Installation: Edit and Complete buttons for Custodian_Approved status */}
                        {form.type === "software-install" &&
                          form.status === "Custodian_Approved" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer p-2 h-8 w-8"
                                onClick={() => {
                                  console.log(
                                    "Edit software installation clicked, form:",
                                    form,
                                  );
                                  setSelectedForm(form);
                                  setEditMode(true);
                                  setShowDetails(true);
                                }}
                                title="Edit Installation Details"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                                onClick={() => {
                                  console.log(
                                    "Complete software installation clicked, form:",
                                    form,
                                  );

                                  // Check if required fields are filled before marking as completed
                                  const installationRemarks =
                                    form.details.installation_remarks;
                                  const feedbackDate =
                                    form.details.feedback_date;

                                  if (!installationRemarks || !feedbackDate) {
                                    const missingFields = [];
                                    if (!installationRemarks)
                                      missingFields.push(
                                        "Installation Remarks",
                                      );
                                    if (!feedbackDate)
                                      missingFields.push("Feedback Date");

                                    alert(
                                      `Please fill in the following required fields before marking as completed:\n\n${missingFields.join("\n")}\n\nClick "Edit" to update form details.`,
                                    );
                                    return;
                                  }

                                  updateStatus(form.id, form.type, "Completed");
                                }}
                              >
                                Completed
                              </Button>
                            </div>
                          )}
                        {form.type === "lab-request" &&
                          form.status === "Admin_Approved" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                // Check if required fields are filled before completing
                                const timeOut = form.details.time_out;
                                const remarks = form.details.remarks;

                                if (!timeOut || !remarks) {
                                  const missingFields = [];
                                  if (!timeOut) missingFields.push("Time Out");
                                  if (!remarks) missingFields.push("Remarks");

                                  alert(
                                    `Please fill in the following required fields before completing:\n\n${missingFields.join("\n")}\n\nClick "Edit" to update the form details.`,
                                  );
                                  return;
                                }

                                updateStatus(form.id, form.type, "Completed");
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                            >
                              Complete
                            </Button>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "lab-request" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold mb-4">Lab Request Form</h2>
            <LabRequestForm />
          </div>
        )}

        {activeTab === "equipment-borrow" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold mb-4">
              Equipment Borrow Form
            </h2>
            <EquipmentBorrowForm />
          </div>
        )}

        {activeTab === "software-install" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold mb-4">
              Software Installation Form
            </h2>
            <SoftwareInstallForm />
          </div>
        )}

        {activeTab === "qr-code" &&
          user?.role === ("Custodian" as users_role) && <QRCodeGenerator />}

        {/* Add FormDetailsModal for Custodian users */}
        {selectedForm && (
          <>
            {console.log(
              "About to render FormDetailsModal (Custodian path) - selectedForm:",
              selectedForm,
              "showDetails:",
              showDetails,
            )}
            <FormDetailsModal
              show={showDetails}
              form={selectedForm}
              editMode={editMode}
              onClose={() => {
                console.log("Modal onClose called (Custodian path)");
                setShowDetails(false);
                setEditMode(false);
              }}
              onUpdateStatus={updateStatus}
              onUpdate={fetchForms} // Refresh forms data after save
              userRole={user?.role}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Form Approval</h1>
          <p className="text-gray-600">
            Review and approve form submissions from students and faculty
          </p>
        </div>
      </div>

      <StatusFilter
        value={filter}
        onChange={setFilter}
        pendingCount={pendingCount}
        userRole={user?.role}
        onDateFilterChange={setDateFilter}
      />

      <FormList
        forms={filteredForms}
        loading={loading}
        onViewDetails={handleViewDetails}
        getStatusColor={getStatusColor}
        getFormTypeLabel={getFormTypeLabel}
        onUpdateStatus={updateStatus}
        userRole={user?.role}
        selectedForms={selectedForms}
        onSelectionChange={setSelectedForms}
        onBulkApprove={handleBulkApprove}
        onEditForm={handleEditForm}
      />

      {selectedForm && (
        <>
          {console.log(
            "About to render FormDetailsModal - selectedForm:",
            selectedForm,
            "showDetails:",
            showDetails,
          )}
          <FormDetailsModal
            show={showDetails}
            form={selectedForm}
            editMode={editMode}
            onClose={() => {
              console.log("Modal onClose called");
              setShowDetails(false);
              setEditMode(false);
            }}
            onUpdateStatus={updateStatus}
            onUpdate={fetchForms} // Refresh forms data after save
            userRole={user?.role}
          />
        </>
      )}

      {user?.role === ("Custodian" as users_role) && (
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
