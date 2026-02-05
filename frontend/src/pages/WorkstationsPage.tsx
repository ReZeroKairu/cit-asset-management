import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAllWorkstations } from "../api/workstations";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Plus, Monitor, Package } from "lucide-react";
import AddWorkstationModal from "../components/inventory/AddWorkstationModal";
import AddAssetModal from "../components/inventory/AddAssetModal";

interface Workstation {
  workstation_id: number;
  workstation_name: string;
  lab_id: number | null;
  created_at: string;
  laboratory?: {
    lab_id: number;
    lab_name: string;
    location?: string;
  };
  assets?: {
    asset_id: number;
    item_name: string;
    property_tag_no: string;
    serial_number: string;
    units: {
      unit_name: string;
    };
  }[];
}

const WorkstationsPage: React.FC = () => {
  const { user } = useAuth();
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWorkstations();
  }, []);

  const loadWorkstations = async () => {
    try {
      setLoading(true);
      const data = await getAllWorkstations();
      setWorkstations(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load workstations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setShowModal(true);
  };

  const handleAddAsset = () => {
    setShowAssetModal(true);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    loadWorkstations();
  };

  const handleAssetModalSuccess = () => {
    setShowAssetModal(false);
    loadWorkstations();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workstations Management</h1>
        <p className="text-gray-600">Manage computer workstations in laboratories</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Registered Workstations
            </CardTitle>
            <div className="flex space-x-2">
              {(user?.role === 'Admin' || user?.role === 'Custodian') && (
                <Button onClick={handleAddAsset}>
                  <Package className="w-4 h-4 mr-2" />
                  Assign Asset
                </Button>
              )}
              {(user?.role === 'Admin' || user?.role === 'Custodian') && (
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Workstation
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : workstations.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No workstations found</p>
              {(user?.role === 'Admin' || user?.role === 'Custodian') && (
                <div className="mt-4 space-x-2">
                  <Button onClick={handleAddAsset}>
                    <Package className="w-4 h-4 mr-2" />
                    Assign Asset
                  </Button>
                  <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Workstation
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Workstation Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Laboratory
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Assets
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workstations.map((workstation) => (
                    <tr key={workstation.workstation_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <Monitor className="w-4 h-4 mr-2 text-blue-600" />
                          {workstation.workstation_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {workstation.laboratory?.lab_name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {workstation.laboratory?.location || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {workstation.assets && workstation.assets.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                {workstation.assets.length} assets
                              </span>
                            </div>
                            <div className="max-w-xs">
                              {workstation.assets.slice(0, 3).map((asset) => (
                                <div key={asset.asset_id} className="text-xs text-gray-600 truncate" title={asset.item_name}>
                                  • {asset.property_tag_no} - {asset.item_name}
                                </div>
                              ))}
                              {workstation.assets.length > 3 && (
                                <div className="text-xs text-gray-400">
                                  +{workstation.assets.length - 3} more...
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            No assets assigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(workstation.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workstation Modal */}
      <AddWorkstationModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Asset Modal */}
      <AddAssetModal
        show={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        onSuccess={handleAssetModalSuccess}
      />
    </div>
  );
};

export default WorkstationsPage;
