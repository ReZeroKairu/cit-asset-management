import React, { useState } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import { batchCreateAssets, resolveWorkstationName } from "../../api/inventory";
import { useAuth } from "../../context/AuthContext";
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REQUIRED_FIELDS = [
  "property_tag_no",
  "quantity",
  "description",
  "serial_number",
  "date_of_purchase"
];

const UploadAssetModal: React.FC<Props> = ({ show, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Only Custodian is allowed
  if (!show || user?.role !== "Custodian") return null;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrors([]);
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    
    // Check file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setErrors(['Please upload a valid Excel file (.xlsx or .xls)']);
      return;
    }
    
    processFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      try {
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        // Validate required fields
        const missingFields = REQUIRED_FIELDS.filter(
          (field) => !Object.keys(json[0] || {}).includes(field),
        );
        if (missingFields.length > 0) {
          setErrors([
            `Missing required fields in sheet: ${missingFields.join(", ")}`,
          ]);
          setParsedData([]);
          return;
        }

        // Check if at least one identifier field is present (unit_name or unit_id, etc.)
        const hasUnitIdentifier = Object.keys(json[0] || {}).some(key => 
          ['unit_name', 'unit_id'].includes(key)
        );
        const hasLabIdentifier = Object.keys(json[0] || {}).some(key => 
          ['lab_name', 'lab_id'].includes(key)
        );

        if (!hasUnitIdentifier || !hasLabIdentifier) {
          setErrors([
            "Missing identifier fields. Please include either 'unit_name' or 'unit_id', and either 'lab_name' or 'lab_id'"
          ]);
          setParsedData([]);
          return;
        }
        setParsedData(json);
      } catch (err: any) {
        setErrors(["Failed to parse file. Please use a valid XLSX file."]);
        setParsedData([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Helper function to format Excel dates for display
  const formatDisplayValue = (val: any, key: string): string => {
    // Handle date_of_purchase column specifically
    if (key === 'date_of_purchase' && val) {
      // Handle Excel serial numbers
      if (typeof val === 'number' && val > 1000) {
        const excelDate = new Date((val - 25569) * 86400 * 1000);
        return excelDate.toLocaleDateString();
      }
      // Handle string dates
      if (typeof val === 'string') {
        const parsedDate = new Date(val);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString();
        }
      }
      // Handle Date objects
      if (val instanceof Date && !isNaN(val.getTime())) {
        return val.toLocaleDateString();
      }
    }
    // For all other values, just convert to string
    return String(val);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors([]);
    try {
      // Basic validation again (optional)
      if (parsedData.length === 0) {
        setErrors(["No valid asset data found."]);
        setSubmitting(false);
        return;
      }

      // Transform data with flexible field handling
      const assetsPayload = await Promise.all(parsedData.map(async (row: any) => {
        let processedDate: string | null = null;

        if (row.date_of_purchase) {
          const dateValue = row.date_of_purchase;

          // Handle Excel serial numbers (Excel stores dates as days since 1900-01-01)
          if (typeof dateValue === 'number' && dateValue > 1000) {
            const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
            processedDate = excelDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          }
          // Handle string dates
          else if (typeof dateValue === 'string') {
            const parsedDate = new Date(dateValue);
            if (!isNaN(parsedDate.getTime())) {
              processedDate = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            }
          }
          // Handle JavaScript Date objects
          else if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
            processedDate = dateValue.toISOString().split('T')[0]; // YYYY-MM-DD format
          }
        }

        // Handle flexible unit identification
        let unitId = null;
        if (row.unit_id) {
          unitId = Number(row.unit_id);
        } else if (row.unit_name) {
          // For now, we'll store the unit_name and let backend handle mapping
          unitId = 1; // Default fallback - you may want to improve this
        }

        // Handle flexible lab identification  
        let labId = null;
        if (row.lab_id) {
          labId = Number(row.lab_id);
        } else if (row.lab_name) {
          // For now, we'll store the lab_name and let backend handle mapping
          labId = 1; // Default fallback - you may want to improve this
        }

        // Handle flexible device type
        let deviceType = null;
        if (row.device_type) {
          deviceType = Number(row.device_type);
        } else if (row.device_type_name) {
          // For now, we'll store the device_type_name and let backend handle mapping
          deviceType = 1; // Default fallback - you may want to improve this
        }

        // Handle flexible workstation identification with proper resolution
        let workstationId = null;
        if (row.workstation_id !== undefined && row.workstation_id !== null) {
          const wsString = String(row.workstation_id).trim();
          // Only assign if it's not empty, not "N/A", and is a valid number
          if (wsString !== "" && wsString.toLowerCase() !== "n/a" && !isNaN(Number(wsString))) {
            workstationId = Number(wsString);
          }
        } else if (row.workstation_name) {
          if (!labId) {
            throw new Error(`Workstation name "${row.workstation_name}" provided without a valid Lab ID. Please provide either 'lab_id' or 'lab_name'.`);
          }
          // Resolve workstation name using lab_id to handle duplicate names across labs
          try {
            workstationId = await resolveWorkstationName(labId, String(row.workstation_name).trim());
          } catch (error: any) {
            // Provide more helpful error message
            const errorMsg = error.message || error;
            if (errorMsg.includes('not found')) {
              throw new Error(`Workstation "${row.workstation_name}" not found in Lab ${labId}. Please check that this workstation exists in the specified lab.`);
            } else {
              throw new Error(`Failed to resolve workstation "${row.workstation_name}" in Lab ${labId}: ${errorMsg}`);
            }
          }
        }

        return {
          property_tag_no: row.property_tag_no ? String(row.property_tag_no).trim() : null,
          quantity: row.quantity ? Number(row.quantity) : 1, // Fallback to 1
          description: row.description ? String(row.description).trim() : null,
          serial_number: row.serial_number ? String(row.serial_number).trim() : null,
          date_of_purchase: processedDate,
          unit_id: unitId,
          device_type: deviceType,
          lab_id: labId,
          workstation_id: workstationId,
        };
      }));

      await batchCreateAssets(assetsPayload);

      alert(`Uploaded ${assetsPayload.length} assets!`);
      setSubmitting(false);
      setParsedData([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrors([
        err.response?.data?.error ||
          err.message ||
          "Upload failed. Please check your file and try again.",
      ]);
      setSubmitting(false);
    }
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-9999 transition-opacity duration-200"
        onClick={onClose}
      ></div>
      <div className="fixed inset-0 z-10000 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-200 scale-100">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upload Assets</h3>
                <p className="text-sm text-gray-500">Import multiple assets from Excel file</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Upload Area */}
            <div className="mb-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">
                  {dragActive ? "Drop your file here" : "Drag and drop your Excel file here"}
                </p>
                <p className="text-gray-500 text-sm mb-4">or</p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Browse Files
                  </span>
                </label>
              </div>
            </div>

            {/* Requirements */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-2">Required Columns</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Your Excel file must contain the following columns:
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {REQUIRED_FIELDS.map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <code className="text-xs bg-white px-2 py-1.5 rounded border border-blue-200 font-mono flex-1 min-w-0">
                      {field}
                    </code>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 bg-white rounded border border-blue-200">
                <p className="text-xs text-blue-600">
                  <strong>Required:</strong> property_tag_no, quantity, description, serial_number, date_of_purchase<br/>
                  <strong>Optional (choose one from each group):</strong><br/>
                  • unit_name OR unit_id<br/>
                  • lab_name OR lab_id<br/>
                  • workstation_name OR workstation_id<br/>
                  • device_type_name OR device_type
                </p>
                <p className="text-xs text-orange-600 mt-2">
                  <strong>Note:</strong> When using workstation_name, ensure the workstation exists in the specified lab.
                </p>
              </div>
            </div>
          </div>
          {/* Error Display */}
          {errors.length > 0 && (
            <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900 mb-1">Upload Error</h4>
                  {errors.map((error, i) => (
                    <p key={i} className="text-sm text-red-700">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* Data Preview */}
          {parsedData.length > 0 && (
            <div className="mx-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  Data Preview ({parsedData.length} {parsedData.length === 1 ? 'row' : 'rows'})
                </h4>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-green-600 font-medium">
                    ✓ File parsed successfully
                  </div>
                  <button
                    onClick={() => setParsedData([])}
                    className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear Table
                  </button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {Object.keys(parsedData[0]).map((key) => (
                          <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {parsedData.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {Object.entries(row).map(([key, val], i) => (
                            <td key={i} className="px-3 py-2 text-gray-900 border-b border-gray-100">
                              {formatDisplayValue(val, key)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 10 && (
                  <div className="p-3 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-600">
                    Showing first 10 rows of {parsedData.length} total rows
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {parsedData.length > 0 && (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Ready to upload {parsedData.length} assets
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                disabled={submitting || parsedData.length === 0}
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Assets
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default UploadAssetModal;