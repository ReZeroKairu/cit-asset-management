import React, { useState } from "react";
import { X, Wrench } from "lucide-react";
import { createRepairLog } from "../../api/maintenance";

interface WorkstationAssetItem {
  asset_id: number;
  unit_name: string;
  property_tag_no: string | null;
  status: string;
}

interface StatusOption {
  status_id: number;
  status_name: string;
}

interface Props {
  workstation: { id: number; name: string };
  quarter: string;
  labId: number;
  assets: WorkstationAssetItem[];
  statusOptions: StatusOption[];
  onSuccess: () => void;
  onClose: () => void;
}

const RepairModal: React.FC<Props> = ({
  workstation,
  quarter,
  labId,
  assets,
  statusOptions,
  onSuccess,
  onClose,
}) => {
  const [serviceDate, setServiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [actionType, setActionType] = useState<
    "REPAIR" | "REPLACE" | "UPGRADE"
  >("REPAIR");
  const [selectedAssets, setSelectedAssets] = useState<Set<number>>(new Set());
  const [newStatus, setNewStatus] = useState("Functional");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Replacement fields
  const [replacementDetails, setReplacementDetails] = useState<{
    [key: number]: {
      new_property_tag: string;
      new_serial_number: string;
      new_description: string;
    };
  }>({});

  const handleAssetToggle = (assetId: number) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  const handleReplacementDetailChange = (
    assetId: number,
    field: string,
    value: string,
  ) => {
    setReplacementDetails((prev) => ({
      ...prev,
      [assetId]: {
        ...(prev[assetId] || {
          new_property_tag: "",
          new_serial_number: "",
          new_description: "",
        }),
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedAssets.size === 0) {
      setError("Please select at least one component.");
      return;
    }

    setLoading(true);

    try {
      const asset_actions = Array.from(selectedAssets).map((assetId) => {
        const asset = assets.find((a) => a.asset_id === assetId);
        const action: Record<string, unknown> = {
          asset_id: assetId,
          action:
            actionType === "REPAIR"
              ? "REPAIRED"
              : actionType === "REPLACE"
                ? "REPLACED"
                : "UPGRADED",
          status_before: asset?.status || "Unknown",
          status_after: newStatus,
          old_property_tag: asset?.property_tag_no,
        };

        if (actionType === "REPLACE" && replacementDetails[assetId]) {
          action.new_property_tag =
            replacementDetails[assetId].new_property_tag;
          action.new_serial_number =
            replacementDetails[assetId].new_serial_number;
          action.new_description = replacementDetails[assetId].new_description;
        }

        return action;
      });

      await createRepairLog({
        workstation_id: workstation.id,
        quarter,
        lab_id: labId,
        service_date: serviceDate,
        service_type: actionType,
        remarks,
        asset_actions,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to create repair log:", err);
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Failed to submit repair log");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Wrench className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Repair Component
              </h2>
              <p className="text-sm text-gray-600">
                {workstation.name} - {quarter} Quarter
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Service Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Date
            </label>
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActionType("REPAIR")}
                className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                  actionType === "REPAIR"
                    ? "bg-orange-100 border-orange-500 text-orange-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Repair
              </button>
              <button
                type="button"
                onClick={() => setActionType("REPLACE")}
                className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                  actionType === "REPLACE"
                    ? "bg-red-100 border-red-500 text-red-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => setActionType("UPGRADE")}
                className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                  actionType === "UPGRADE"
                    ? "bg-purple-100 border-purple-500 text-purple-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Upgrade
              </button>
            </div>
          </div>

          {/* Select Components */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Component(s)
            </label>
            <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
              {assets.map((asset) => (
                <label
                  key={asset.asset_id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedAssets.has(asset.asset_id)}
                    onChange={() => handleAssetToggle(asset.asset_id)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {asset.unit_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {asset.property_tag_no || "No tag"} - {asset.status}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Replacement Details (only shown when Replace is selected) */}
          {actionType === "REPLACE" && selectedAssets.size > 0 && (
            <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-sm font-semibold text-red-900">
                Replacement Details
              </h3>
              {Array.from(selectedAssets).map((assetId) => {
                const asset = assets.find((a) => a.asset_id === assetId);
                return (
                  <div key={assetId} className="space-y-2">
                    <p className="text-xs font-medium text-red-800">
                      {asset?.unit_name} ({asset?.property_tag_no})
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        placeholder="New Property Tag"
                        value={
                          replacementDetails[assetId]?.new_property_tag || ""
                        }
                        onChange={(e) =>
                          handleReplacementDetailChange(
                            assetId,
                            "new_property_tag",
                            e.target.value,
                          )
                        }
                        className="px-3 py-1.5 text-sm border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <input
                        type="text"
                        placeholder="New Serial Number"
                        value={
                          replacementDetails[assetId]?.new_serial_number || ""
                        }
                        onChange={(e) =>
                          handleReplacementDetailChange(
                            assetId,
                            "new_serial_number",
                            e.target.value,
                          )
                        }
                        className="px-3 py-1.5 text-sm border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={
                          replacementDetails[assetId]?.new_description || ""
                        }
                        onChange={(e) =>
                          handleReplacementDetailChange(
                            assetId,
                            "new_description",
                            e.target.value,
                          )
                        }
                        className="px-3 py-1.5 text-sm border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* New Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            >
              {statusOptions.map((status) => (
                <option key={status.status_id} value={status.status_name}>
                  {status.status_name}
                </option>
              ))}
            </select>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Additional notes about this repair..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedAssets.size === 0}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4" />
                  Submit Repair
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RepairModal;
