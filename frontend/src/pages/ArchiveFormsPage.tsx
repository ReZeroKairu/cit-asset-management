import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { FileText, Download } from "lucide-react";
import { FormDetailsModal } from "../components/forms/FormDetailsModal";
import { useAuth } from "../context/AuthContext";
import {
  getSoftwareInstallations,
} from "../api/forms";
import { generateFormDocument } from "../utils/formTemplateMapping";
import { getFormStatusColor } from "../utils/statusUtils";
import {
  formatUserType,
  formatLaboratory,
} from "../utils/formatUtils";
import { type FormSubmission } from "../types/forms";

const ArchiveFormsPage = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("software-install");
  const [dateFilter, setDateFilter] = useState({
    start_date: "",
    end_date: "",
  });
  const [selectedForm, setSelectedForm] = useState<FormSubmission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchArchivedForms();
  }, [activeTab, dateFilter]);

  const fetchArchivedForms = async () => {
    try {
      setLoading(true);
      const [softwareInstallationsRes] =
        await Promise.all([
          getSoftwareInstallations(),
        ]);

      // Extract data from API responses
      const softwareInstallations = Array.isArray(softwareInstallationsRes)
        ? softwareInstallationsRes
        : softwareInstallationsRes?.data || [];

      // Transform to FormSubmission structure (same as FormsManagementPage)
      const transformedForms: any[] = [
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
        })),
      ];

      // Filter for archived/completed forms only - role-based filtering
      let archivedForms = transformedForms.filter((form) => {
        if (user?.role === "Admin") {
          // Admin sees Admin_Approved and Completed statuses
          return (
            form.status === "Admin_Approved" || form.status === "Completed"
          );
        } else if (user?.role === "Custodian") {
          // Custodian sees only Completed and Denied statuses
          return (
            form.status === "Completed" ||
            form.status === "Denied"
          );
        } else {
          // Default fallback - show only truly archived statuses
          return (
            form.status === "Completed" ||
            form.status === "Denied"
          );
        }
      });

      // Apply role-based filtering for custodians
      let filteredArchivedForms = archivedForms;
      if (user?.role === "Custodian") {
        filteredArchivedForms = archivedForms.filter((form) => {
          // Show forms created by this custodian or forms from their assigned lab
          return (
            form.userId === user.id ||
            (form.laboratory &&
              user.lab_id &&
              form.laboratory.toLowerCase().includes(`lab${user.lab_id}`))
          );
        });
      }

      // Apply date filtering
      let filteredForms = filteredArchivedForms;
      if (dateFilter.start_date) {
        filteredForms = filteredForms.filter((form) => {
          const formDate = new Date(form.createdAt);
          const startDate = new Date(dateFilter.start_date + "T00:00:00");
          return formDate >= startDate;
        });
      }

      if (dateFilter.end_date) {
        filteredForms = filteredForms.filter((form) => {
          const formDate = new Date(form.createdAt);
          const endDate = new Date(dateFilter.end_date + "T23:59:59");
          return formDate <= endDate;
        });
      }

      setForms(filteredForms);
    } catch (err) {
      setError("Failed to fetch archived forms");
      console.error("Error fetching archived forms:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    return null;
  };

  const handleViewForm = (form: any) => {
    // Form is already in FormSubmission structure, no transformation needed
    setSelectedForm(form);
    setIsModalOpen(true);
  };

  const handleDownloadForm = async (form: any) => {
    try {
      await generateFormDocument(form);
    } catch (error) {
      console.error("Error downloading form:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Archived Forms</h1>
        <p className="text-gray-600 mt-1">
          Completed and processed form submissions
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

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

      {/* Date Filters */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateFilter.start_date}
              onChange={(e) =>
                setDateFilter((prev) => ({
                  ...prev,
                  start_date: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateFilter.end_date}
              onChange={(e) =>
                setDateFilter((prev) => ({ ...prev, end_date: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setDateFilter({ start_date: "", end_date: "" })}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Forms List */}
      <div className="space-y-4">
        {forms.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No archived forms found
              </h3>
              <p className="text-gray-500">No forms have been archived yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Form Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-80">
                    User Details
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {forms.map((form) => (
                  <tr
                    key={`${form.type}-${form.id}`}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => handleViewForm(form)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Software Installation
                      </div>
                      {form.details?.purpose && (
                        <div className="text-sm text-gray-500 mt-1 truncate max-w-sm">
                          {form.details.purpose}
                        </div>
                      )}
                      {form.type === "software-install" &&
                        form.details?.software_list && (
                          <div className="text-sm text-gray-500 mt-1 truncate max-w-sm">
                            {form.details.software_list}
                          </div>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {form.name ||
                          form.details?.faculty_name ||
                          "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {form.details?.user_type && (
                          <span className="capitalize">
                            {formatUserType(form.details.user_type)}
                          </span>
                        )}
                        {form.laboratory && (
                          <span>
                            {" "}
                            {form.details?.user_type ? " \u2022 " : ""}
                            {formatLaboratory(form.laboratory)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFormStatusColor(
                          form.status
                        )}`}
                      >
                        <span className="flex items-center gap-1">
                          {getStatusIcon()}
                          {form.status.replace("_", " ")}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {new Date(form.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleDownloadForm(form)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors cursor-pointer"
                          title="Download Form"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Details Modal */}
      {selectedForm && (
        <FormDetailsModal
          show={isModalOpen}
          form={selectedForm}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedForm(null);
          }}
        />
      )}
    </div>
  );
};

export default ArchiveFormsPage;
