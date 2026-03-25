import React, { useState } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import { batchCreateAssets } from "../../api/inventory";
import { useAuth } from "../../context/AuthContext";

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
  "date_of_purchase",
  "unit_id",
  "device_type",
  "lab_id",
  // Optionally add workstation_id if required
];

const UploadAssetModal: React.FC<Props> = ({ show, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Only Custodian is allowed
  if (!show || user?.role !== "Custodian") return null;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrors([]);
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      try {
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        // Validate fields
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

      // Transform date_of_purchase - handle Excel serial numbers and date formats
      const assetsPayload = parsedData.map((row: any) => {
        let processedDate: string | null = null;

        if (row.date_of_purchase) {
          const dateValue = row.date_of_purchase;

          // Handle Excel serial numbers (Excel stores dates as days since 1900-01-01)
          if (typeof dateValue === 'number' && dateValue > 1000) {
            // Excel serial number to JavaScript Date
            // Excel's epoch starts at 1900-01-01, but Excel incorrectly treats 1900 as a leap year
            // So we need to subtract 1 day for dates after 1900-02-28
            const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
            processedDate = excelDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            console.log(`Excel serial ${dateValue} converted to ${processedDate}`);
          }
          // Handle string dates
          else if (typeof dateValue === 'string') {
            const parsedDate = new Date(dateValue);
            if (!isNaN(parsedDate.getTime())) {
              processedDate = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
              console.log(`String date "${dateValue}" converted to ${processedDate}`);
            }
          }
          // Handle JavaScript Date objects
          else if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
            processedDate = dateValue.toISOString().split('T')[0]; // YYYY-MM-DD format
            console.log(`Date object converted to ${processedDate}`);
          }
          else {
            console.log(`Unrecognized date format:`, dateValue, typeof dateValue);
          }
        }

        return {
          property_tag_no: row.property_tag_no?.trim() || null,
          quantity: Number(row.quantity),
          description: row.description?.trim() || null,
          serial_number: row.serial_number?.trim() || null,
          date_of_purchase: processedDate,
          unit_id: Number(row.unit_id),
          device_type: Number(row.device_type),
          lab_id: Number(row.lab_id),
          workstation_id: row.workstation_id ? Number(row.workstation_id) : null,
        };
      });

      await batchCreateAssets(assetsPayload);

      alert(`Uploaded ${assetsPayload.length} assets!`);
      setSubmitting(false);
      setParsedData([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrors([
        err.response?.data?.error ||
          "Upload failed. Please check your file and try again.",
      ]);
      setSubmitting(false);
    }
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/40 z-9999"
        onClick={onClose}
      ></div>
      <div className="fixed inset-0 z-10000 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl w-[500px]">
          <h3 className="text-lg font-semibold mb-4">Upload Assets (XLSX)</h3>
          <div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="mb-2"
            />
            <div className="text-xs text-gray-500 mb-3">
              <p>
                <b>Required columns:</b>{" "}
                {REQUIRED_FIELDS.join(", ")}
              </p>
              <p>
                Example: property_tag_no, quantity, description, serial_number,
                date_of_purchase, unit_id, device_type, lab_id, workstation_id
              </p>
            </div>
          </div>
          {errors.length > 0 && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-2">
              {errors.map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          )}
          {parsedData.length > 0 && (
            <div className="my-2 max-h-56 overflow-y-auto border rounded">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {Object.keys(parsedData[0]).map((key) => (
                      <th key={key} className="px-2 py-1">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((row, idx) => (
                    <tr key={idx}>
                      {Object.entries(row).map(([key, val], i) => (
                        <td key={i} className="px-2 py-1">{formatDisplayValue(val, key)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={onClose}
              className="px-3 py-1 border rounded text-gray-700"
              disabled={submitting}
            >Cancel</button>
            <button
              disabled={submitting || parsedData.length === 0}
              onClick={handleSubmit}
              className={`px-4 py-1 bg-blue-600 text-white rounded ${submitting || parsedData.length === 0 ? "bg-gray-400" : ""}`}
            >{submitting ? "Uploading..." : "Upload"}</button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default UploadAssetModal;