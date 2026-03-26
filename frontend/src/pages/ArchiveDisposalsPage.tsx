import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Trash2, Calendar, DollarSign, Package } from "lucide-react";
import { getAllDisposals } from "../api/disposals";
import type { Disposal } from "../api/disposals";

const ArchiveDisposalsPage = () => {
  const [disposals, setDisposals] = useState<Disposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDisposals = async () => {
      try {
        const response = await getAllDisposals();
        setDisposals(response.data);
      } catch (err) {
        console.error("Failed to fetch disposals:", err);
        setError("Failed to load disposal records");
      } finally {
        setLoading(false);
      }
    };

    fetchDisposals();
  }, []);

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
        <p className="text-gray-600">Archive of all disposed assets</p>
      </div>

      {disposals.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Disposal Records</h3>
              <p className="text-gray-500">No assets have been disposed yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {disposals.map((disposal) => (
            <Card key={disposal.disposal_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Trash2 className="w-5 h-5 text-gray-500" />
                      <h3 className="font-semibold text-gray-900">
                        Asset #{disposal.asset_id}
                      </h3>
                      <Badge className={getMethodColor(disposal.disposal_method)}>
                        <span className="flex items-center gap-1">
                          {getMethodIcon(disposal.disposal_method)}
                          {disposal.disposal_method}
                        </span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                      {disposal.asset?.asset_details?.property_tag_no && (
                        <div>
                          <span className="font-medium">Property Tag:</span> {disposal.asset.asset_details.property_tag_no}
                        </div>
                      )}
                      {disposal.asset?.asset_details?.description && (
                        <div>
                          <span className="font-medium">Description:</span> {disposal.asset.asset_details.description}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Lab:</span> {disposal.lab_name || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Disposal Date:</span> {new Date(disposal.disposal_date).toLocaleDateString()}
                      </div>
                      {disposal.disposal_value && (
                        <div>
                          <span className="font-medium">Value:</span> ₱{disposal.disposal_value.toLocaleString()}
                        </div>
                      )}
                      <div className="md:col-span-2 lg:col-span-3">
                        <span className="font-medium">Reason:</span> {disposal.disposal_reason}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchiveDisposalsPage;
