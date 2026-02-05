//frontend/src/components/EmbeddedCreateUserForm.tsx
import React, { useState, useEffect } from "react";
import api from "../api/axios";

interface Props {
  onSuccess: () => void;
  formData: {
    full_name: string;
    email: string;
    password: string;
    role: string;
    lab_id: string;
    selectedCampus: string;
    selectedOfficeType: string;
    selectedDept: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      full_name: string;
      email: string;
      password: string;
      role: string;
      lab_id: string;
      selectedCampus: string;
      selectedOfficeType: string;
      selectedDept: string;
    }>
  >;
}

const EmbeddedCreateUserForm: React.FC<Props> = ({
  onSuccess,
  formData,
  setFormData,
}) => {
  // --- Data Sources ---
  const [campuses, setCampuses] = useState<any[]>([]);
  const [officeTypes, setOfficeTypes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [laboratories, setLaboratories] = useState<any[]>([]);

  // --- UI State ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingCustodians, setExistingCustodians] = useState<{
    [key: number]: string;
  }>({});

  // Load Dropdown Data on component mount
  useEffect(() => {
    api.get("/users/organization-data").then((res) => {
      setCampuses(res.data.campuses);
      setOfficeTypes(res.data.officeTypes);
      setDepartments(res.data.departments);
      setLaboratories(res.data.laboratories);
    });

    // Load existing custodian assignments
    api.get("/users/assignments").then((res) => {
      const custodians: { [key: number]: string } = {};
      res.data.forEach((user: any) => {
        if (user.role === "Custodian" && user.lab_id) {
          custodians[user.lab_id] = user.full_name;
        }
      });
      setExistingCustodians(custodians);
    });
  }, []);

  // --- Filtering Logic ---
  // 1. Filter Departments based on Campus AND Office Type
  const filteredDepartments = departments.filter(
    (dept) =>
      (!formData.selectedCampus ||
        dept.campus_id === Number(formData.selectedCampus)) &&
      (!formData.selectedOfficeType ||
        dept.office_type_id === Number(formData.selectedOfficeType)),
  );

  // 2. Filter Labs based on Selected Department
  const filteredLabs = laboratories.filter(
    (lab) =>
      !formData.selectedDept || lab.dept_id === Number(formData.selectedDept),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate lab assignment for custodians
    if ((formData.role === "Custodian" || !formData.role) && !formData.lab_id) {
      setError("Please assign a laboratory to the custodian.");
      setLoading(false);
      return;
    }

    // Check if lab already has a custodian assigned
    if (formData.lab_id && (formData.role === "Custodian" || !formData.role)) {
      const labId = Number(formData.lab_id);
      if (existingCustodians[labId]) {
        setError(
          `Cannot assign custodian to this laboratory. ${existingCustodians[labId]} is already assigned as the custodian.`,
        );
        setLoading(false);
        return;
      }
    }

    try {
      await api.post("/users", formData);

      // Reset form
      setFormData({
        full_name: "",
        email: "",
        password: "",
        role: "Custodian",
        lab_id: "",
        selectedCampus: "",
        selectedOfficeType: "",
        selectedDept: "",
      });

      // Call success callback
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <h6 className="text-blue-600 font-semibold border-b border-gray-200 pb-2">
          1. Account Details
        </h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={formData.password}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.role}
              onChange={(e) => {
                const newRole = e.target.value;
                setFormData({
                  ...formData,
                  role: newRole,
                  // Clear lab assignment if switching to Admin role
                  lab_id: newRole === "Admin" ? "" : formData.lab_id,
                });
              }}
            >
              <option value="Custodian">Custodian</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>

        <h6 className="text-blue-600 font-semibold border-b border-gray-200 pb-2">
          2. Assign Area{" "}
          {(formData.role === "Custodian" || !formData.role) &&
            "(Cascading Selection)"}
        </h6>

        {formData.role === "Custodian" || !formData.role ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campus
              </label>
              <select
                value={formData.selectedCampus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) =>
                  setFormData({ ...formData, selectedCampus: e.target.value })
                }
              >
                <option value="">Select Campus...</option>
                {campuses.map((c) => (
                  <option key={c.campus_id} value={c.campus_id}>
                    {c.campus_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Office Type
              </label>
              <select
                value={formData.selectedOfficeType}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    selectedOfficeType: e.target.value,
                  })
                }
              >
                <option value="">Select Type...</option>
                {officeTypes.map((o) => (
                  <option key={o.type_id} value={o.type_id}>
                    {o.type_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={formData.selectedDept}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={
                  !formData.selectedCampus && !formData.selectedOfficeType
                }
                onChange={(e) =>
                  setFormData({ ...formData, selectedDept: e.target.value })
                }
              >
                <option value="">Select Department...</option>
                {filteredDepartments.map((d) => (
                  <option key={d.dept_id} value={d.dept_id}>
                    {d.dept_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 font-semibold text-green-600">
                Assign Laboratory <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.lab_id}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
                disabled={!formData.selectedDept}
                onChange={(e) =>
                  setFormData({ ...formData, lab_id: e.target.value })
                }
              >
                <option value="">Select Laboratory to Assign...</option>
                {filteredLabs.map((l) => {
                  const hasCustodian = existingCustodians[l.lab_id];
                  return (
                    <option
                      key={l.lab_id}
                      value={l.lab_id}
                      disabled={!!hasCustodian}
                      className={hasCustodian ? "text-gray-400" : ""}
                    >
                      {l.lab_name}{" "}
                      {hasCustodian
                        ? `(Already assigned to ${hasCustodian})`
                        : ""}
                    </option>
                  );
                })}
              </select>
              {formData.lab_id && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    This user will be assigned as the Laboratory Manager
                    (in_charge_id) for the selected laboratory.
                  </p>
                </div>
              )}
              {Object.keys(existingCustodians).length > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-700 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Laboratories with existing custodians are disabled in the
                    dropdown above.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-sm text-gray-600 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Admin users do not require laboratory assignment. They have
              system-wide access.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            onClick={() => {
              // Reset form
              setFormData({
                full_name: "",
                email: "",
                password: "",
                role: "Custodian",
                lab_id: "",
                selectedCampus: "",
                selectedOfficeType: "",
                selectedDept: "",
              });
              setError("");
            }}
          >
            Clear Form
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                Creating User...
              </>
            ) : (
              "Create User"
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default EmbeddedCreateUserForm;
