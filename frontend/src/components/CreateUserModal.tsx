import React, { useState, useEffect } from "react";
import api from "../api/axios";

interface Props {
  show: boolean;
  onClose: () => void;
}

const CreateUserModal: React.FC<Props> = ({ show, onClose }) => {
  // --- Data Sources ---
  const [campuses, setCampuses] = useState<any[]>([]);
  const [officeTypes, setOfficeTypes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [laboratories, setLaboratories] = useState<any[]>([]);

  // --- Form Selection State ---
  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedOfficeType, setSelectedOfficeType] = useState("");
  const [selectedDept, setSelectedDept] = useState("");

  // --- User Form State ---
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "Custodian",
    lab_id: "",
  });

  // Load Dropdown Data on Open
  useEffect(() => {
    if (show) {
      api.get("/users/organization-data").then((res) => {
        setCampuses(res.data.campuses);
        setOfficeTypes(res.data.officeTypes);
        setDepartments(res.data.departments);
        setLaboratories(res.data.laboratories);
      });
    }
  }, [show]);

  // --- Filtering Logic ---
  // 1. Filter Departments based on Campus AND Office Type
  const filteredDepartments = departments.filter(
    (dept) =>
      (!selectedCampus || dept.campus_id === Number(selectedCampus)) &&
      (!selectedOfficeType ||
        dept.office_type_id === Number(selectedOfficeType)),
  );

  // 2. Filter Labs based on Selected Department
  const filteredLabs = laboratories.filter(
    (lab) => !selectedDept || lab.dept_id === Number(selectedDept),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate lab assignment for custodians
    if ((formData.role === "Custodian" || !formData.role) && !formData.lab_id) {
      alert("Please assign a laboratory to the custodian.");
      return;
    }

    try {
      const response = await api.post("/users", formData);
      alert(response.data.message || "User Created Successfully!");
      onClose();

      // Reset form
      setFormData({
        full_name: "",
        email: "",
        password: "",
        role: "Custodian",
        lab_id: "",
      });
      setSelectedCampus("");
      setSelectedOfficeType("");
      setSelectedDept("");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create user");
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40"></div>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create New User</h3>
              <button
                type="button"
                className="text-white hover:text-gray-200 transition-colors"
                onClick={onClose}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <h6 className="text-blue-600 font-semibold border-b border-gray-200 pb-2 mb-4">
                  1. Account Details
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
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

                <h6 className="text-blue-600 font-semibold border-b border-gray-200 pb-2 mb-4">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onChange={(e) => setSelectedCampus(e.target.value)}
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onChange={(e) => setSelectedOfficeType(e.target.value)}
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={!selectedCampus && !selectedOfficeType}
                        onChange={(e) => setSelectedDept(e.target.value)}
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
                        Assign Laboratory{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                        disabled={!selectedDept}
                        onChange={(e) =>
                          setFormData({ ...formData, lab_id: e.target.value })
                        }
                      >
                        <option value="">Select Laboratory to Assign...</option>
                        {filteredLabs.map((l) => (
                          <option key={l.lab_id} value={l.lab_id}>
                            {l.lab_name}
                          </option>
                        ))}
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
                      Admin users do not require laboratory assignment. They
                      have system-wide access.
                    </p>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex items-center justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateUserModal;
