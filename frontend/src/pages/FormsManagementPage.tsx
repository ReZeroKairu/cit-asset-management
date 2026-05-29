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
  Download,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { FormDetailsModal } from "../components/forms/FormDetailsModal";
import { generateFormDocument } from "../utils/formTemplateMapping";
import {
  getSoftwareInstallations,
  updateSoftwareInstallationStatus,
} from "../api/forms";
import { type FormSubmission } from "../types/forms";

export const FormsManagementPage = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("software-install");
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
      const [softwareInstallationsRes] =
        await Promise.all([
          getSoftwareInstallations(dateFilter),
        ]);

      // Extract data from API responses
      const softwareInstallations =
        softwareInstallationsRes.data || softwareInstallationsRes;

      // Transform to FormSubmission structure
      const transformedForms: FormSubmission[] = [
        ...softwareInstallations.map((install: any) => ({
          id: install.id || `soft-${Math.random()}`,
          type: "software-install" as const,
          date: install.date,
          name: install.faculty_name,
          status: install.status,
          laboratory: install.laboratory,
          purpose: install.software_list,
          createdAt: install.created_at,
          details: install,
          userId: install.user_id || install.users?.id,
          completed_at: install.completed_at || install.details?.completed_at,
          software_id: install.id,
        })),
      ];

      // Filter forms based on user role and status
      const filteredForms = transformedForms.filter((form) => {
        const isAdmin = user?.role === "Admin";
        const currentUserId = user?.id;
        
        // Status filtering
        const statusMatch = isAdmin
          ? form.status === "Custodian_Approved" || form.status === "Completed" || form.status === "Denied"
          : form.status === "Completed" || form.status === "Denied";
        
        // Ownership filtering
        const ownershipMatch = isAdmin || form.userId === currentUserId;
        
        return statusMatch && ownershipMatch;
      });

      // Sort by creation date (newest first)
      setForms(
        filteredForms.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateForm = async (form: any) => {
    try {
      await generateFormDocument(form);
    } catch (error) {
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
        case "software-install":
          response = await updateSoftwareInstallationStatus(formId, newStatus);
          break;
        default:
          return;
      }

      if (response.success) {
        fetchForms(); // Refresh the list
      }
    } catch (error) {
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "Approved":
      case "Custodian_Approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "Denied":
        return <XCircle className="w-4 h-4 text-red-500" />;
            case "Completed":
        return null; // Remove icon for Completed status
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
      case "Custodian_Approved":
        return "bg-blue-100 text-blue-800";
      case "Denied":
        return "bg-red-100 text-red-800";
            case "Completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFormTypeLabel = (type: string) => {
    switch (type) {
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
              <SelectItem value="Custodian_Approved">Custodian Approved</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Denied">Denied</SelectItem>
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
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <input
              type="date"
              placeholder="End Date"
              value={dateFilter.end_date}
              onChange={(e) =>
                setDateFilter((prev) => ({ ...prev, end_date: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
            <Card 
              key={`${form.type}-${form.id}`} 
              className="cursor-pointer hover:shadow-md hover:shadow-blue-100 hover:border-blue-200 transition-all duration-200"
              onClick={() => {
                setSelectedForm(form);
                setShowDetails(true);
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <h3 className="font-semibold text-gray-900">
                        {getFormTypeLabel(form.type)}
                      </h3>
                      <Badge className={`${getStatusColor(form.status)} border-0`}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(form.status)}
                          {form.status}
                        </span>
                      </Badge>
                    </div>

                    {/* Purpose field moved below name and date */}
                    {form.details?.purpose && (
                      <div className="mt-2 text-sm text-gray-600">
                        {form.details.purpose}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      Submitted: {new Date(form.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    {form.status === "Pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            updateStatus(form.id, form.type, "Approved")
                          }
                          className="bg-green-600 hover:bg-green-700 cursor-pointer"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            updateStatus(form.id, form.type, "Denied")
                          }
                          className="cursor-pointer"
                        >
                          Deny
                        </Button>
                      </>
                    )}

                    {/* Generate Form Document Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateForm(form)}
                      className="cursor-pointer"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
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
          onUpdateStatus={async (
            formId: number,
            formType: string,
            newStatus: string
          ) => {
            await updateStatus(formId, formType, newStatus);
          }}
          onUpdate={fetchForms} // Refresh forms data after save
          userRole={user?.role}
        />
      )}
    </div>
  );
};
