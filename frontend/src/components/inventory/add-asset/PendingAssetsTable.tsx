import React from "react";

interface AssetEntry {
  id: string;
  property_tag_no: string;
  quantity: number;
  description: string;
  serial_number: string;
  date_of_purchase: string;
  unit_id: number;
  unit_name: string;
  device_type: string;
  lab_id: number;
  lab_name: string;
  workstation_id?: number;
  workstation_name?: string;
}

interface Props {
  assets: AssetEntry[];
  onRemove: (id: string) => void;
}

const PendingAssetsTable: React.FC<Props> = ({ assets, onRemove }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 font-medium text-sm flex justify-between">
        <span className="text-gray-700">Pending Assets ({assets.length})</span>
      </div>

      {assets.length > 0 ? (
        <div className="max-h-60 overflow-y-auto bg-white">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 sticky top-0 shadow-sm">
              <tr>
                <th className="px-4 py-3 font-semibold">Unit</th>
                <th className="px-4 py-3 font-semibold">Tag</th>
                <th className="px-4 py-3 font-semibold">Qty</th>
                <th className="px-4 py-3 font-semibold">Workstation</th>
                <th className="px-4 py-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assets.map((asset) => (
                <tr
                  key={asset.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {asset.unit_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {asset.property_tag_no || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{asset.quantity}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {asset.workstation_name || "None"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onRemove(asset.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-md transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-400 text-sm bg-white">
          No assets added yet.
        </div>
      )}
    </div>
  );
};

export default PendingAssetsTable;
