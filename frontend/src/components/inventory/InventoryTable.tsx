//frontend/src/components/inventory/InventoryTable.tsx
import React from "react";

interface AssetProps {
  assets: any[];
}

const InventoryTable: React.FC<AssetProps> = ({ assets }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            <th className="px-6 py-3 text-left">Property Tag</th>
            <th className="px-6 py-3 text-left">Item Name</th>
            <th className="px-6 py-3 text-left">Description</th>
            <th className="px-6 py-3 text-left">Serial No.</th>
            <th className="px-6 py-3 text-left">Location (Lab)</th>
            <th className="px-6 py-3 text-left">Unit Type</th>
            <th className="px-6 py-3 text-left">Qty</th>
            <th className="px-6 py-3 text-left">Purchase Date</th>
            <th className="px-6 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {/* Example Row */}
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 font-bold text-blue-600">CIT-2024-001</td>
            <td className="px-6 py-4 font-semibold">MacBook Pro M1</td>
            <td className="px-6 py-4 text-gray-500 text-sm max-w-[200px] truncate">
              Space Grey, 16GB RAM, 512GB SSD
            </td>
            <td className="px-6 py-4 font-mono text-sm">C02XYZ123</td>
            <td className="px-6 py-4">
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Computer Lab 1
              </span>
            </td>
            <td className="px-6 py-4">Laptop</td>
            <td className="px-6 py-4">1</td>
            <td className="px-6 py-4">2024-01-15</td>
            <td className="px-6 py-4">
              <div className="flex gap-2">
                <button 
                  className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50 transition-colors cursor-pointer" 
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          {/* Add Mapping logic here: {assets.map(asset => ...)} */}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;
