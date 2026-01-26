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
      api.get("/organization-data").then((res) => {
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
    if (!formData.lab_id) {
      alert("Please assign a laboratory to the custodian.");
      return;
    }
    try {
      await api.post("/users", formData);
      alert("User Created Successfully!");
      onClose();
      // Optionally reset form here
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create user");
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h5 className="modal-title">Create New User</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <h6 className="text-primary border-bottom pb-2 mb-3">
                  1. Account Details
                </h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      required
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Role</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                    >
                      <option value="Custodian">Custodian</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>

                <h6 className="text-primary border-bottom pb-2 mb-3">
                  2. Assign Area (Cascading Selection)
                </h6>
                <div className="row g-3">
                  {/* STEP A: Select Campus */}
                  <div className="col-md-6">
                    <label className="form-label">Campus</label>
                    <select
                      className="form-select"
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

                  {/* STEP B: Select Office Type */}
                  <div className="col-md-6">
                    <label className="form-label">Office Type</label>
                    <select
                      className="form-select"
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

                  {/* STEP C: Select Department (Filtered) */}
                  <div className="col-md-12">
                    <label className="form-label">Department</label>
                    <select
                      className="form-select"
                      disabled={!selectedCampus}
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

                  {/* STEP D: Select Lab (Filtered - Final Assignment) */}
                  <div className="col-md-12">
                    <label className="form-label fw-bold text-success">
                      Assign Laboratory
                    </label>
                    <select
                      className="form-select"
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
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
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
