import React, { useState } from "react";
import { createUnit } from "../../../api/inventory";
import { createPortal } from "react-dom";

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: (newUnit: any) => void;
  deviceTypeId: number;
  deviceTypeName: string;
}

const AddUnitModal: React.FC<Props> = ({
  show,
  onClose,
  onSuccess,
  deviceTypeId,
  deviceTypeName,
}) => {
  const [unitName, setUnitName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!unitName.trim()) {
      setError("Unit name is required");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const newUnit = await createUnit({
        unit_name: unitName.trim(),
        device_type_id: deviceTypeId,
      });
      
      setSuccess(`Unit "${newUnit.unit_name}" created successfully!`);
      onSuccess(newUnit);
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create unit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setUnitName("");
    setError("");
    setSuccess("");
    onClose();
  };

  // Add ESC key support
  React.useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && show) {
        handleClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [show]);

  if (!show) return null;

  return createPortal(
    <>
      <div 
        className="fixed inset-0 backdrop-blur-md bg-black/20 z-9999 transition-opacity"
        onClick={handleClose}
      ></div>
      <div 
        className="fixed inset-0 z-10000 overflow-y-auto"
        onClick={handleClose}
      >
        <div className="flex items-center justify-center min-h-screen px-4 py-6">
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl">
              <h3 className="text-lg font-semibold">Add New Unit</h3>
              <p className="text-sm text-blue-100 mt-1">
                Device Type: {deviceTypeName}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unit Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Monitor, CPU, Keyboard"
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
                {success && (
                  <p className="mt-2 text-sm text-green-600">{success}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {submitting ? "Creating..." : success ? "Created!" : "Create Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
    , document.body);
};

export default AddUnitModal;
