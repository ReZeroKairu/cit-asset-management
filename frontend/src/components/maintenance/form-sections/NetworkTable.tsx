//frontend/src/components/maintenance/form-sections/NetworkTable.tsx (Specialized table for Network & Software)
import React from "react";
import { Network } from "lucide-react";

interface OtherItem {
  name: string;
  remarks: string;
  status: string;
}

interface Props {
  items: OtherItem[];
  onItemChange: (index: number, field: keyof OtherItem, value: string) => void;
}

export const NetworkTable: React.FC<Props> = ({ items, onItemChange }) => {
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-purple-50 px-4 py-2 border-b border-purple-100 flex items-center">
        <Network className="w-5 h-5 text-purple-600 mr-2" />
        <h3 className="font-medium text-purple-900">Network & Software</h3>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/4">
              Item Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/5">
              Property Tag
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[35%]">
              Remarks
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[20%]">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item, index) => (
            <tr key={index}>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {item.name}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">N/A</td>
              <td className="px-6 py-4 text-sm">
                {item.name === "Connectivity Type" ? (
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        checked={item.remarks === "Wired"}
                        onChange={() => onItemChange(index, "remarks", "Wired")}
                      />
                      <span className="ml-2 text-sm text-gray-700">Wired</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        checked={item.remarks === "Wireless"}
                        onChange={() =>
                          onItemChange(index, "remarks", "Wireless")
                        }
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Wireless
                      </span>
                    </label>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={item.remarks}
                    onChange={(e) =>
                      onItemChange(index, "remarks", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-purple-500 outline-none"
                    placeholder="Remarks..."
                  />
                )}
              </td>
              <td className="px-6 py-4 text-sm">
                <select
                  value={item.status}
                  onChange={(e) =>
                    onItemChange(index, "status", e.target.value)
                  }
                  className="block w-full pl-2 pr-8 py-1 text-sm border-gray-300 rounded-md outline-none text-green-700 bg-green-50"
                >
                  <option value="Functional">Functional</option>
                  <option value="Not Functional">Not Functional</option>
                  <option value="N/A">N/A</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
