//frontend/src/components/EditLaboratoryModal.tsx
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import api from "../api/axios";

interface Laboratory {
  lab_id: number;
  lab_name: string;
  location?: string | null;
  dept_id?: number | null;
}

interface Props {
  lab: Laboratory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditLaboratoryModal: React.FC<Props> = ({
  lab,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    lab_name: "",
    location: "",
    dept_id: null as number | null,
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load departments and form data when modal opens
  useEffect(() => {
    if (isOpen) {
      // Load departments
      api.get("/users/organization-data").then((res) => {
        setDepartments(res.data.departments);
      });

      // Set form data from lab
      if (lab) {
        setFormData({
          lab_name: lab.lab_name,
          location: lab.location || "",
          dept_id: lab.dept_id || null,
        });
      }
    }
  }, [isOpen, lab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lab) return;

    setLoading(true);
    setError("");

    try {
      await api.put(`/laboratories/${lab.lab_id}`, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update laboratory");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40"></div>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Laboratory</h3>
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
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="lab_name">Laboratory Name</Label>
                <Input
                  id="lab_name"
                  type="text"
                  placeholder="Enter laboratory name"
                  value={formData.lab_name}
                  onChange={(e) =>
                    setFormData({ ...formData, lab_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Enter location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <select
                  id="department"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.dept_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dept_id: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                >
                  <option value="">Select Department...</option>
                  {departments.map((dept) => (
                    <option key={dept.dept_id} value={dept.dept_id}>
                      {dept.dept_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Laboratory"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditLaboratoryModal;
