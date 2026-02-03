import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getLaboratories, updateLaboratory, deleteLaboratory } from "../api/laboratories";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Plus, Edit, Trash2, Building } from "lucide-react";
import EmbeddedLaboratoryForm from "../components/EmbeddedLaboratoryForm";
import EditLaboratoryModal from "../components/EditLaboratoryModal";

interface Laboratory {
  lab_id: number;
  lab_name: string;
  location?: string | null;
  dept_id?: number | null;
  users?: {
    user_id: number;
    full_name: string;
    email: string;
    role: string;
  }[];
  departments?: {
    dept_id: number;
    dept_name: string;
  };
}

interface LabFormData {
  lab_name: string;
  location?: string | null;
  dept_id?: number | null;
}

interface LaboratoriesPageProps {
  labFormData: LabFormData;
  setLabFormData: React.Dispatch<React.SetStateAction<LabFormData>>;
}

const LaboratoriesPage: React.FC<LaboratoriesPageProps> = ({ labFormData, setLabFormData }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'labs' | 'create'>('labs');
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [editingLab, setEditingLab] = useState<Laboratory | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const labsData = await getLaboratories();
      setLabs(labsData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    }
  };

  const handleLabCreated = () => {
    // Refresh labs data and switch to labs tab
    setActiveTab('labs');
    loadData();
    
    // Reset lab form data
    setLabFormData({
      lab_name: '',
      location: '',
      dept_id: null,
    });
  };

  const handleEdit = (lab: Laboratory) => {
    setEditingLab(lab);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    // Refresh labs data
    loadData();
    setEditingLab(null);
    setShowEditModal(false);
  };

  const handleEditClose = () => {
    setEditingLab(null);
    setShowEditModal(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this laboratory? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteLaboratory(id);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete laboratory');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laboratories Management</h1>
        <p className="text-gray-600">Manage laboratory information and assignments</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('labs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'labs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Laboratories
          </button>
          {user?.role === 'Admin' && (
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Add Laboratory
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'labs' && (
        <div>
          {/* Labs Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lab Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Custodians
                    </th>
                    {user?.role === 'Admin' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {labs.map((lab) => (
                    <tr key={lab.lab_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {lab.lab_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lab.location || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lab.departments?.dept_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lab.users && lab.users.length > 0 ? (
                          <div className="space-y-1">
                            {lab.users.map((user) => (
                              <div key={user.user_id} className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{user.full_name}</span>
                                <span className="text-gray-400 text-xs">({user.email})</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">No custodian assigned</span>
                        )}
                      </td>
                      {user?.role === 'Admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(lab)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(lab.lab_id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Create New Laboratory</h3>
          <EmbeddedLaboratoryForm 
            onSuccess={handleLabCreated} 
            formData={labFormData}
            setFormData={setLabFormData}
          />
        </div>
      )}

      {/* Edit Laboratory Modal */}
      <EditLaboratoryModal
        lab={editingLab}
        isOpen={showEditModal}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default LaboratoriesPage;
