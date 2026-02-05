//frontend/src/components/EmbeddedLaboratoryForm.tsx
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Building, Save, RotateCcw } from "lucide-react";
import api from "../api/axios";

interface LabFormData {
  lab_name: string;
  location?: string | null;
  dept_id?: number | null;
}

interface Props {
  onSuccess: () => void;
  formData: LabFormData;
  setFormData: React.Dispatch<React.SetStateAction<LabFormData>>;
}

const EmbeddedLaboratoryForm: React.FC<Props> = ({
  onSuccess,
  formData,
  setFormData,
}) => {
  // --- Data Sources ---
  const [departments, setDepartments] = useState<any[]>([]);

  // --- UI State ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load Departments on component mount
  useEffect(() => {
    api.get("/users/organization-data").then((res) => {
      setDepartments(res.data.departments);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/laboratories", formData);

      // Reset form
      setFormData({
        lab_name: "",
        location: "",
        dept_id: null,
      });

      // Call success callback
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create laboratory");
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
          Laboratory Information
        </h6>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Laboratory Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.lab_name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              onChange={(e) =>
                setFormData({ ...formData, lab_name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={formData.dept_id || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            onClick={() => {
              // Reset form
              setFormData({
                lab_name: "",
                location: "",
                dept_id: null,
              });
              setError("");
            }}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear Form
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Laboratory
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default EmbeddedLaboratoryForm;
