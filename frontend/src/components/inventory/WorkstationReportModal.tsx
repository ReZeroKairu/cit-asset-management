//frontend/src/components/inventory/WorkstationReportModal.tsx
import React from "react";
import { FileDown, X, Lock } from "lucide-react";
import { generateTemplateReport } from "../../utils/generateTemplateReport";

interface Lab {
  lab_id: number;
  lab_name: string;
}

interface WorkstationAsset {
  asset_id: number;
  property_tag_no: string | null;
  serial_number: string | null;
  description: string | null;
  quantity: number | null;
  unit_name: string | null;
  remarks: string | null;
}

interface Workstation {
  workstation_id: number;
  workstation_name: string;
  lab_name: string | null;
  location: string | null;
  lab_id: number;
  assets: WorkstationAsset[];
}

interface Props {
  show: boolean;
  onClose: () => void;
  selectedLab: string;
  setSelectedLab: (lab: string) => void;
  labs: Lab[];
  workstations: Workstation[];
  user: any;
  loading: boolean;
  children: React.ReactNode;
}

const WorkstationReportModal: React.FC<Props> = ({
  show,
  onClose,
  selectedLab,
  setSelectedLab,
  labs,
  workstations,
  user,
  loading,
  children,
}) => {
  // Add ESC key support
  React.useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && show) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [show, onClose]);

  const handleDownload = async () => {
    if (workstations.length === 0) return;

    // 1. Prepare dynamic suffixes (Lab Name)
    let labSuffix = "";
    if (selectedLab) {
      const selectedLabObj = labs.find((l) => l.lab_id === Number(selectedLab));
      if (selectedLabObj) {
        labSuffix = ` - ${selectedLabObj.lab_name.trim()}`;
      }
    }

    // 2. Get Current Date & Time
    const now = new Date();

    // A. Format for the Document Content (e.g., "February 3, 2026 - 10:30 AM")
    const reportDateContent = now.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // B. Format for the Filename (Safe characters, e.g., "Feb-03-2026_10-30AM")
    const dateFileStr = now
      .toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
      .replace(/[\/,\s]/g, "-"); // Replaces slashes/spaces with dashes

    const timeFileStr = now
      .toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(/[:\s]/g, ""); // Removes colons and spaces

    const fileName = `LDCU-Forms-CIT-032-Laboratory Equipment Inventory${labSuffix} - ${dateFileStr}_${timeFileStr}.docx`;

    // 3. Structure data for the document
    const structuredWorkstations = workstations.map((ws) => ({
      workstation_name: ws.workstation_name,
      assets: ws.assets.map((asset) => ({
        property_tag: asset.property_tag_no || "N/A",
        serial_number: asset.serial_number || "N/A",
        description: `${asset.unit_name || "Device"} - ${asset.description || ""}`,
        remarks: asset.remarks || "",
      })),
    }));

    const reportData = {
      lab_name: workstations[0]?.lab_name || "Unassigned Laboratory",
      custodian_name: (user?.name || "Unknown Custodian").toUpperCase(),
      report_date: reportDateContent,
      location: workstations[0]?.location || "Main Campus",
      workstations: structuredWorkstations,
    };

    try {
      await generateTemplateReport(
        "/inventory_template.docx",
        reportData,
        fileName,
      );
    } catch (error) {
      console.error("Download failed:", error);
      alert(
        "Failed to generate report. Please check if the template exists in the public folder.",
      );
    }
  };

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-md bg-black/20 overflow-y-auto h-full w-full z-50"
      onClick={onClose}
    >
      <div 
        className="relative top-10 mx-auto p-0 w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 bg-blue-600 text-white rounded-t-md">
          <h3 className="text-xl font-semibold">
            Workstation Inventory Report
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={loading || workstations.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              Download Word Doc
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-white">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Filter by Lab:
            </label>
            <div className="relative">
              <select
                className={`border rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-8 ${
                  user?.role === "Custodian"
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "bg-white"
                }`}
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value)}
                disabled={user?.role === "Custodian"}
              >
                <option value="">All Laboratories</option>
                {labs.map((lab) => (
                  <option key={lab.lab_id} value={lab.lab_id}>
                    {lab.lab_name}
                  </option>
                ))}
              </select>
              {user?.role === "Custodian" && (
                <Lock className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2" />
              )}
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default WorkstationReportModal;
