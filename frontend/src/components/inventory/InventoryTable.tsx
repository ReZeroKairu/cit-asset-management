//frontend/src/components/inventory/InventoryTable.tsx
import React from "react";

interface AssetProps {
  assets: any[];
}

const InventoryTable: React.FC<AssetProps> = ({ assets }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover table-striped align-middle">
        <thead className="table-light">
          <tr className="text-uppercase text-xs font-bold text-gray-600">
            <th>Property Tag</th>
            <th>Item Name</th>
            <th>Description</th>
            <th>Serial No.</th>
            <th>Location (Lab)</th>
            <th>Unit Type</th>
            <th>Qty</th>
            <th>Purchase Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Example Row */}
          <tr>
            <td className="fw-bold text-primary">CIT-2024-001</td>
            <td className="fw-semibold">MacBook Pro M1</td>
            <td className="text-muted text-sm max-w-[200px] truncate">
              Space Grey, 16GB RAM, 512GB SSD
            </td>
            <td className="font-mono text-sm">C02XYZ123</td>
            <td>
              <span className="badge bg-info text-dark">Computer Lab 1</span>
            </td>
            <td>Laptop</td>
            <td>1</td>
            <td>2024-01-15</td>
            <td>
              <div className="flex gap-2">
                <button className="btn btn-sm btn-outline-warning" title="Edit">
                  <i className="bi bi-pencil"></i>
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  title="Delete"
                >
                  <i className="bi bi-trash"></i>
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
