import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Trash2, Calendar, DollarSign, Package, Monitor, Cpu } from "lucide-react";
import { getAllDisposals } from "../api/disposals";
import { getInventory } from "../api/inventory";
import type { Disposal } from "../api/disposals";
import type { Asset } from "../api/inventory";

const ArchiveDisposalsPage = () => {
  const [disposals, setDisposals] = useState<Disposal[]>([]);
  const [disposedAssets, setDisposedAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both disposal records and all assets (will filter by status name)
        const [disposalsResponse, allAssetsResponse] = await Promise.all([
          getAllDisposals(),
          getInventory() // Fetch all assets, then filter by status name
        ]);
        
        setDisposals(disposalsResponse.data);
        // Filter assets by status name "Disposed" for database compatibility
        const disposedAssets = allAssetsResponse.filter(
          (asset: Asset) => asset.asset_details?.asset_statuses?.status_name === "Disposed"
        );
        setDisposedAssets(disposedAssets);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load disposal data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getUnitIcon = (unitName?: string) => {
    const name = (unitName || "").toLowerCase();
    if (name.includes("monitor") || name.includes("display")) {
      return <Monitor className="w-4 h-4 text-gray-400" />;
    }
    if (name.includes("cpu") || name.includes("computer")) {
      return <Cpu className="w-4 h-4 text-gray-400" />;
    }
    return <Package className="w-4 h-4 text-gray-400" />;
  };

  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case "sold": return "bg-green-100 text-green-800";
      case "scrap": return "bg-red-100 text-red-800";
      case "donated": return "bg-blue-100 text-blue-800";
      case "lost": return "bg-orange-100 text-orange-800";
      case "stolen": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case "sold": return <DollarSign className="w-3 h-3" />;
      case "scrap": return <Trash2 className="w-3 h-3" />;
      case "donated": return <Package className="w-3 h-3" />;
      case "lost": return <Calendar className="w-3 h-3" />;
      case "stolen": return <Calendar className="w-3 h-3" />;
      default: return <Trash2 className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading disposal records...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Asset Disposals</h1>
        <p className="text-gray-600">Archive of all disposed assets and disposal records</p>
      </div>

      {/* Disposed Assets Table */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Disposed Assets</h2>
        {disposedAssets.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Disposed Assets</h3>
                <p className="text-gray-500">No assets have been marked as disposed.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property Tag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Workstation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {disposedAssets.map((asset) => (
                    <tr key={asset.asset_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{asset.asset_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {asset.asset_details?.property_tag_no || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {asset.asset_details?.description || "No description"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {asset.asset_details?.serial_number || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          {getUnitIcon(asset.units?.unit_name)}
                          {asset.units?.unit_name || "N/A"}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {asset.workstations?.workstation_name || "Unassigned"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className="bg-gray-100 text-gray-800">
                          Disposed
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      
    </div>
  );
};

export default ArchiveDisposalsPage;
