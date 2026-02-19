import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { FormDetailsModal } from "../components/forms/FormDetailsModal";
import { generateFormDocument } from "../utils/formTemplateMapping";
import {
  getLabRequests,
  getEquipmentBorrows,
  getSoftwareInstallations,
  updateLabRequestStatus,
  updateEquipmentBorrowStatus,
  updateSoftwareInstallationStatus,
} from "../api/forms";

interface FormSubmission {
  id: number;
  type: "lab-request" | "equipment-borrow" | "software-install";
  date: string;
  name: string;
  status:
    | "Pending"
    | "Approved"
    | "Denied"
    | "Returned"
    | "Completed"
    | "Admin_Approved";
  laboratory: string;
  purpose: string;
  createdAt: string;
  userId?: number;
  details: any;
  // Form-specific ID fields
  request_id?: number;
  borrow_id?: number;
  software_id?: number;
}

export const FormsManagementPage = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<{
    start_date: string;
    end_date: string;
  }>({ start_date: "", end_date: "" });
  const [selectedForm, setSelectedForm] = useState<FormSubmission | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchForms();
  }, [filter, activeTab, dateFilter]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const [labRequestsRes, equipmentBorrowsRes, softwareInstallationsRes] =
        await Promise.all([
          getLabRequests(dateFilter),
          getEquipmentBorrows(dateFilter),
          getSoftwareInstallations(dateFilter),
        ]);

      // Extract data from API responses
      const labRequests = labRequestsRes.data || labRequestsRes;
      const equipmentBorrows = equipmentBorrowsRes.data || equipmentBorrowsRes;
      const softwareInstallations =
        softwareInstallationsRes.data || softwareInstallationsRes;

      // Filter for archive: show different statuses based on user role and ownership
      const isAdmin = user?.role === "Admin";
      const currentUserId = user?.id;

      // For testing, assume user ID is 2 if not available
      const testUserId = currentUserId || 2;

      console.log("🔍 Archive API responses:", {
        labRequests,
        equipmentBorrows,
        softwareInstallations,
        labRequestsType: typeof labRequests,
        isArray: Array.isArray(labRequests),
        currentUserId,
        testUserId,
        userRole: user?.role,
        user: user,
        userExists: !!user,
        userIdType: typeof user?.id,
      });

      // Debug: Check first few items to understand the data structure
      if (labRequests && labRequests.length > 0) {
        console.log("🔍 Sample lab request:", labRequests[0]);
      }
      if (equipmentBorrows && equipmentBorrows.length > 0) {
        console.log("🔍 Sample equipment borrow:", equipmentBorrows[0]);
      }

      const archivedLabRequests = Array.isArray(labRequests)
        ? labRequests.filter((req: any) => {
            const statusMatch = isAdmin
              ? req.status === "Admin_Approved" ||
                req.status === "Completed" ||
                req.status === "Denied"
              : req.status === "Completed" || req.status === "Denied";

            // Temporarily show all forms to debug data structure
            const ownershipMatch =
              isAdmin ||
              req.user_id === testUserId ||
              req.users?.id === testUserId ||
              (req.submittedVia === "one-time-token" &&
                req.userId === testUserId);

            console.log("🔍 Lab request filtering:", {
              requestId: req.request_id,
              status: req.status,
              user_id: req.user_id,
              usersId: req.users?.id,
              submittedVia: req.submittedVia,
              reqUserId: req.userId,
              currentUserId,
              testUserId,
              currentUserIdType: typeof currentUserId,
              user_idType: typeof req.user_id,
              statusMatch,
              ownershipMatch,
              isAdmin,
              user_id_equals_testUserId: req.user_id == testUserId,
              user_id_strict_equals_testUserId: req.user_id === testUserId,
              usersId_equals_testUserId: req.users?.id == testUserId,
              usersId_strict_equals_testUserId: req.users?.id === testUserId,
            });

            return statusMatch && ownershipMatch;
          })
        : [];

      const archivedEquipmentBorrows = Array.isArray(equipmentBorrows)
        ? equipmentBorrows.filter((borrow: any) => {
            const statusMatch = isAdmin
              ? borrow.status === "Admin_Approved" ||
                borrow.status === "Returned" ||
                borrow.status === "Denied"
              : borrow.status === "Returned" || borrow.status === "Denied";

            // Temporarily show all forms to debug data structure
            const ownershipMatch =
              isAdmin ||
              borrow.user_id === testUserId ||
              borrow.users?.id === testUserId ||
              (borrow.submittedVia === "one-time-token" &&
                borrow.userId === testUserId);

            console.log("🔍 Equipment borrow filtering:", {
              borrowId: borrow.borrow_id,
              status: borrow.status,
              user_id: borrow.user_id,
              usersId: borrow.users?.id,
              submittedVia: borrow.submittedVia,
              borrowUserId: borrow.userId,
              currentUserId,
              testUserId,
              statusMatch,
              ownershipMatch,
              isAdmin,
              user_id_equals_testUserId: borrow.user_id == testUserId,
              user_id_strict_equals_testUserId: borrow.user_id === testUserId,
              usersId_equals_testUserId: borrow.users?.id == testUserId,
              usersId_strict_equals_testUserId: borrow.users?.id === testUserId,
            });

            return statusMatch && ownershipMatch;
          })
        : [];

      const archivedSoftwareInstallations = Array.isArray(softwareInstallations)
        ? softwareInstallations.filter((install: any) => {
            const statusMatch = isAdmin
              ? install.status === "Completed" || install.status === "Denied" // Removed Admin_Approved since custodians handle directly
              : install.status === "Completed" || install.status === "Denied";

            // Temporarily show all forms to debug data structure
            const ownershipMatch =
              isAdmin ||
              install.user_id === testUserId ||
              install.users?.id === testUserId ||
              (install.submittedVia === "one-time-token" &&
                install.userId === testUserId);

            console.log("🔍 Software installation filtering:", {
              installId: install.id,
              status: install.status,
              user_id: install.user_id,
              usersId: install.users?.id,
              submittedVia: install.submittedVia,
              installUserId: install.userId,
              currentUserId,
              statusMatch,
              ownershipMatch,
              isAdmin,
            });

            return statusMatch && ownershipMatch;
          })
        : [];

      const allForms: FormSubmission[] = [
        ...archivedLabRequests.map((req: any) => ({
          id: req.request_id || `lab-${Math.random()}`,
          type: "lab-request" as const,
          date: req.date,
          name: req.faculty_student_name,
          status: req.status,
          laboratory: req.laboratory,
          purpose: req.purpose,
          createdAt: req.created_at,
          details: req,
          request_id: req.request_id,
          userId: req.user_id || req.users?.id,
        })),
        ...archivedEquipmentBorrows.map((borrow: any) => ({
          id: borrow.borrow_id || `equip-${Math.random()}`,
          type: "equipment-borrow" as const,
          date: borrow.date,
          name: borrow.faculty_student_name,
          status: borrow.status,
          laboratory: borrow.laboratory,
          purpose: borrow.purpose,
          createdAt: borrow.created_at,
          details: borrow,
          borrow_id: borrow.borrow_id,
          userId: borrow.user_id || borrow.users?.id,
        })),
        ...archivedSoftwareInstallations.map((install: any) => ({
          id: install.installation_id || `soft-${Math.random()}`,
          type: "software-install" as const,
          date: install.date,
          name: install.faculty_name,
          status: install.status,
          laboratory: install.laboratory,
          purpose: install.software_list,
          createdAt: install.created_at,
          details: install,
          software_id: install.installation_id,
          userId: install.user_id || install.users?.id,
        })),
      ];

      // Sort by creation date (newest first)
      setForms(
        allForms.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    formId: number,
    formType: string,
    newStatus: string
  ) => {
    try {
      let response;
      switch (formType) {
        case "lab-request":
          response = await updateLabRequestStatus(formId, newStatus);
          break;
        case "equipment-borrow":
          response = await updateEquipmentBorrowStatus(formId, newStatus);
          break;
        case "software-install":
          response = await updateSoftwareInstallationStatus(formId, newStatus);
          break;
      }

      if (response.success) {
        fetchForms(); // Refresh the list
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "Approved":
      case "Admin_Approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "Denied":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "Returned":
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Admin_Approved":
        return "bg-green-100 text-green-800";
      case "Denied":
        return "bg-red-100 text-red-800";
      case "Returned":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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

  const filteredForms = forms.filter((form) => {
    const statusMatch = filter === "all" || form.status === filter;
    return statusMatch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Forms Management</h1>
        <p className="text-gray-600">Manage and track all form submissions</p>
      </div>

      {/* Form Type Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === "all"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("all")}
          >
            All Forms
          </button>
          <button
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === "lab-request"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("lab-request")}
          >
            Lab Requests
          </button>
          <button
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === "equipment-borrow"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("equipment-borrow")}
          >
            Equipment Borrows
          </button>
          <button
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === "software-install"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("software-install")}
          >
            Software Installations
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as typeof filter)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Admin_Approved">Admin Approved</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Denied">Denied</SelectItem>
              <SelectItem value="Returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <input
              type="date"
              placeholder="Start Date"
              value={dateFilter.start_date}
              onChange={(e) =>
                setDateFilter((prev) => ({
                  ...prev,
                  start_date: e.target.value,
                }))
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              placeholder="End Date"
              value={dateFilter.end_date}
              onChange={(e) =>
                setDateFilter((prev) => ({ ...prev, end_date: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              onClick={() => setDateFilter({ start_date: "", end_date: "" })}
              variant="outline"
              size="sm"
            >
              Clear Dates
            </Button>
          </div>
        </div>
      </div>

      {/* Forms List */}
      <div className="space-y-4">
        {filteredForms.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No forms found
              </h3>
              <p className="text-gray-500">
                {filter !== "all"
                  ? "Try adjusting your filters"
                  : "No forms have been submitted yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredForms.map((form) => (
            <Card key={`${form.type}-${form.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <h3 className="font-semibold text-gray-900">
                        {getFormTypeLabel(form.type)}
                      </h3>
                      <Badge className={getStatusColor(form.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(form.status)}
                          {form.status}
                        </span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Name:</span> {form.name}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>{" "}
                        {new Date(form.date).toLocaleDateString()}
                      </div>
                      {form.laboratory && (
                        <div>
                          <span className="font-medium">Lab:</span>{" "}
                          {form.laboratory}
                        </div>
                      )}
                    </div>

                    {form.purpose && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Purpose:</span>{" "}
                        {form.purpose}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      Submitted: {new Date(form.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedForm(form);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {form.status === "Pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            updateStatus(form.id, form.type, "Approved")
                          }
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            updateStatus(form.id, form.type, "Denied")
                          }
                        >
                          Deny
                        </Button>
                      </>
                    )}

                    {form.type === "equipment-borrow" &&
                      form.status === "Approved" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateStatus(form.id, form.type, "Returned")
                          }
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Mark Returned
                        </Button>
                      )}

                    {/* Generate Form Document Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        console.log(
                          "Generate button clicked for archived form:",
                          form
                        );
                        generateFormDocument(form);
                      }}
                      className="p-2 h-8 w-8 cursor-pointer hover:bg-gray-100 rounded-md"
                      title="Generate Form Document"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Form Details Modal */}
      {showDetails && selectedForm && (
        <FormDetailsModal
          show={showDetails}
          form={selectedForm}
          onClose={() => {
            setShowDetails(false);
            setSelectedForm(null);
          }}
          onUpdateStatus={(
            formId: number,
            formType: string,
            newStatus: string
          ) => {
            updateStatus(formId, formType, newStatus);
          }}
          onUpdate={fetchForms} // Refresh forms data after save
          userRole={user?.role}
        />
      )}
    </div>
  );
};
