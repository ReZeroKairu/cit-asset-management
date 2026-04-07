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
  "quantity",
  "description",
  "lab_id",
  "date_of_purchase",
  "unit_name"
];

// Device type normalization
const normalizeDeviceType = (deviceType: string): string => {
  if (!deviceType) return '';
  
  const normalized = deviceType.toString().toLowerCase().trim();
  
  const deviceTypeMap: Record<string, string> = {
    'monitor': 'Monitor', 'mon': 'Monitor', 'Monitor': 'Monitor',
    'keyboard': 'Keyboard', 'keyboards': 'Keyboard', 'Keyboard': 'Keyboard',
    'mouse': 'Mouse', 'mice': 'Mouse', 'Mouse': 'Mouse',
    'ssd': 'SSD', 'solid state drive': 'SSD', 'SSD': 'SSD',
    'hdd': 'HDD', 'hard disk drive': 'HDD', 'hard drive': 'HDD', 'hard disk': 'HDD', 'HDD': 'HDD',
    'ram': 'RAM', 'memory': 'RAM', 'Memory': 'RAM', 'RAM': 'RAM',
    'psu': 'PSU', 'power supply': 'PSU', 'Power Supply': 'PSU', 'power supply unit': 'PSU', 'PSU': 'PSU',
    'avr': 'AVR', 'voltage regulator': 'AVR', 'AVR': 'AVR',
    'cpu': 'CPU', 'processor': 'CPU', 'Processor': 'CPU', 'CPU': 'CPU',
    'gpu': 'GPU', 'graphics card': 'GPU', 'video card': 'GPU', 'GPU': 'GPU',
    'motherboard': 'Motherboard', 'Motherboard': 'Motherboard',
    'router': 'Router', 'Router': 'Router',
    'switch': 'Switch', 'Switch': 'Switch',
    'printer': 'Printer', 'Printer': 'Printer'
  };
  
  return deviceTypeMap[normalized] || deviceType;
};

const UploadAssetModal: React.FC<Props> = ({ show, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

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
        setParsedData(json);
      } catch (err: any) {
        setErrors(["Failed to parse file. Please use a valid XLSX file."]);
        setParsedData([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const formatDisplayValue = (val: any, key: string): string => {
    if (key === 'date_of_purchase' && val) {
      if (typeof val === 'number' && val > 1000) {
        const excelDate = new Date((val - 25569) * 86400 * 1000);
        return excelDate.toLocaleDateString();
      }
      if (typeof val === 'string') {
        const parsedDate = new Date(val);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString();
        }
      }
      if (val instanceof Date && !isNaN(val.getTime())) {
        return val.toLocaleDateString();
      }
    }
    return String(val);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors([]);
    try {
      if (parsedData.length === 0) {
        setErrors(["No valid asset data found."]);
        setSubmitting(false);
        return;
      }

      // --- NEW LOGIC: Synchronously deduplicate tags and serials before uploading ---
      const seenTags = new Map<string, number>();
      const seenSerials = new Map<string, number>();

      const preProcessedData = parsedData.map(row => {
        let propTag = row.property_tag_no ? String(row.property_tag_no).trim() : null;
        let serialNum = row.serial_number ? String(row.serial_number).trim() : null;

        // Auto-increment duplicate property tags
        if (propTag) {
          const lowerTag = propTag.toLowerCase();
          if (seenTags.has(lowerTag)) {
            const count = seenTags.get(lowerTag)! + 1;
            seenTags.set(lowerTag, count);
            propTag = `${propTag}-${count}`; // Example: TAG123 becomes TAG123-2
          } else {
            seenTags.set(lowerTag, 1);
          }
        }

        // Auto-increment duplicate serial numbers
        if (serialNum) {
          const lowerSerial = serialNum.toLowerCase();
          if (seenSerials.has(lowerSerial)) {
            const count = seenSerials.get(lowerSerial)! + 1;
            seenSerials.set(lowerSerial, count);
            serialNum = `${serialNum}-${count}`; // Example: SNMOBO becomes SNMOBO-2
          } else {
            seenSerials.set(lowerSerial, 1);
          }
        }

        return {
          ...row,
          property_tag_no: propTag,
          serial_number: serialNum
        };
      });

      // --- Map through the deduplicated data for async operations ---
      const assetsPayload = await Promise.all(preProcessedData.map(async (row: any) => {
        let processedDate: string | null = null;

        if (row.date_of_purchase) {
          const dateValue = row.date_of_purchase;
          if (typeof dateValue === 'number' && dateValue > 1000) {
            const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
            processedDate = excelDate.toISOString().split('T')[0];
          } else if (typeof dateValue === 'string') {
            const parsedDate = new Date(dateValue);
            if (!isNaN(parsedDate.getTime())) {
              processedDate = parsedDate.toISOString().split('T')[0];
            }
          } else if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
            processedDate = dateValue.toISOString().split('T')[0];
          }
        }

        let unitId = null;
        if (row.unit_id) {
          unitId = Number(row.unit_id);
        } else if (row.unit_name) {
          const unitNameNormalized = String(row.unit_name).toLowerCase().trim();
          const unitMap: Record<string, number> = {
            'monitor': 1, 'mon': 1, 'usb ports': 2, 'keyboard': 3, 'keyboards': 3,
            'mouse': 4, 'mice': 4, 'ssd': 5, 'solid state drive': 5, 'psu': 6,
            'power supply': 6, 'power supply unit': 6, 'ram': 7, 'memory': 7,
            'cpu': 8, 'processor': 8, 'hdd': 9, 'hard disk': 9, 'hard drive': 9,
            'hard disk drive': 9, 'case': 10, 'motherboard': 11, 'video card': 12,
            'router': 13, 'switch': 14, 'printer': 15, 'air conditioner': 16,
            'avr': 17, 'voltage regulator': 17, 'cctv camera': 18
          };
          unitId = unitMap[unitNameNormalized] || 1; 
        }

        let labId = null;
        if (row.lab_id) {
          labId = Number(row.lab_id);
        } else if (row.lab_name) {
          labId = 1; 
        }

        let deviceType = null;
        if (row.device_type) {
          deviceType = Number(row.device_type);
        } else if (row.device_type_name) {
          const normalizedDeviceType = normalizeDeviceType(row.device_type_name);
          const deviceTypeNameMap: Record<string, number> = {
            'monitor': 1, 'keyboard': 1, 'mouse': 1, 'ssd': 1, 'psu': 1, 'ram': 1,
            'cpu': 1, 'hdd': 1, 'motherboard': 1, 'gpu': 1, 'avr': 1, 'router': 2,
            'switch': 2, 'printer': 3, 'air conditioner': 3, 'cctv camera': 3,
            'Monitor': 1, 'Keyboard': 1, 'Mouse': 1, 'SSD': 1, 'PSU': 1, 'RAM': 1,
            'CPU': 1, 'HDD': 1, 'Motherboard': 1, 'GPU': 1, 'AVR': 1, 'Router': 2,
            'Switch': 2, 'Printer': 3, 'Air conditioner': 3, 'CCTV camera': 3
          };
          deviceType = deviceTypeNameMap[normalizedDeviceType.toLowerCase()] || null;
        } else if (row.unit_name) {
          const unitNameNormalized = String(row.unit_name).toLowerCase().trim();
          const deviceTypeMap: Record<string, number> = {
            'monitor': 1, 'mon': 1, 'usb ports': 1, 'keyboard': 1, 'keyboards': 1,
            'mouse': 1, 'mice': 1, 'ssd': 1, 'solid state drive': 1, 'psu': 1,
            'power supply': 1, 'power supply unit': 1, 'ram': 1, 'memory': 1,
            'cpu': 1, 'processor': 1, 'hdd': 1, 'hard disk': 1, 'hard drive': 1,
            'hard disk drive': 1, 'system case': 1, 'case': 1, 'cpu fan': 1,
            'motherboard': 1, 'system fan': 1, 'gpu': 1, 'graphics card': 1,
            'video card': 1, 'router': 2, 'switch': 2, 'printer': 3,
            'air conditioner': 3, 'avr': 1, 'voltage regulator': 1, 'cctv camera': 3
          };
          deviceType = deviceTypeMap[unitNameNormalized] || null;
        }

        let workstationId = null;
        if (row.workstation_id !== undefined && row.workstation_id !== null) {
          const wsString = String(row.workstation_id).trim();
          if (wsString !== "" && wsString.toLowerCase() !== "n/a" && !isNaN(Number(wsString))) {
            workstationId = Number(wsString);
          }
        } else if (row.workstation_name) {
          if (!labId) {
            throw new Error(`Workstation name "${row.workstation_name}" provided without a valid Lab ID.`);
          }
          try {
            workstationId = await resolveWorkstationName(labId, String(row.workstation_name).trim());
          } catch (error: any) {
            const errorMsg = error.message || error;
            if (errorMsg.includes('not found')) {
              throw new Error(`Workstation "${row.workstation_name}" not found in Lab ${labId}.`);
            } else {
              throw new Error(`Failed to resolve workstation "${row.workstation_name}" in Lab ${labId}: ${errorMsg}`);
            }
          }
        }

        return {
          property_tag_no: row.property_tag_no,
          quantity: Number(row.quantity),
          description: row.description ? String(row.description).trim() : "-",
          serial_number: row.serial_number,
          date_of_purchase: processedDate,
          unit_id: unitId,
          lab_id: labId,
          workstation_id: workstationId,
          device_type: deviceType,
          status_id: 1, 
        };
      }));

      await batchCreateAssets(assetsPayload);
      
      // TRIGGER SUCCESS SCREEN
      setUploadedCount(assetsPayload.length);
      setUploadSuccess(true);

    } catch (error: any) {
      console.error("Upload error:", error);
      setErrors([error.message || "Failed to upload assets. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setUploadSuccess(false);
    setUploadedCount(0);
    setParsedData([]);
    onSuccess();
    onClose();
  };

  // IF SUCCESSFUL, RENDER THE SUCCESS SCREEN INSTEAD OF THE UPLOAD SCREEN
  if (uploadSuccess) {
    return createPortal(
      <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-9999 transition-opacity duration-200" onClick={handleCloseSuccess}></div>
        <div className="fixed inset-0 z-10000 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 text-center transform transition-all duration-200 scale-100">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Successful!</h3>
            <p className="text-gray-600 mb-8">
              You have successfully imported <span className="font-bold text-gray-900">{uploadedCount}</span> asset{uploadedCount !== 1 ? 's' : ''} to the database.
            </p>
            <button
              onClick={handleCloseSuccess}
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </>,
      document.body
    );
  }

  // STANDARD UPLOAD SCREEN
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
                  <strong>Required:</strong> quantity, description, lab_id, date_of_purchase, unit_name<br/>
                  <strong>Optional:</strong> property_tag_no, serial_number<br/>
                  <strong>Optional (choose one from each group):</strong><br/>
                  • workstation_name OR workstation_id<br/>
                  • device_type_name OR device_type
                </p>
                <p className="text-xs text-orange-600 mt-2">
                  <strong>Note:</strong> When using workstation_name, ensure the workstation exists in the specified lab. Missing optional fields will be set to "-".
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