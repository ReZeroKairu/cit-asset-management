import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getLaboratories, createLaboratory, updateLaboratory, deleteLaboratory } from "../api/laboratories";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Plus, Edit, Trash2, Building } from "lucide-react";

interface Laboratory {
  lab_id: number;
  lab_name: string;
  location?: string | null;
  dept_id?: number | null;
  lab_in_charge?: string | null;
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
  lab_in_charge?: string | null;
}

const LaboratoriesPage: React.FC = () => {
  const { user } = useAuth();
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingLab, setEditingLab] = useState<Laboratory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<LabFormData>({
    lab_name: '',
    location: '',
    dept_id: null,
    lab_in_charge: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const labsData = await getLaboratories();
      setLabs(labsData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingLab(null);
    setFormData({
      lab_name: '',
      location: '',
      dept_id: null,
      lab_in_charge: '',
    });
    setError('');
    setShowModal(true);
  };

  const handleEdit = (lab: Laboratory) => {
    setEditingLab(lab);
    setFormData({
      lab_name: lab.lab_name,
      location: lab.location || '',
      dept_id: lab.dept_id || null,
      lab_in_charge: lab.lab_in_charge || '',
    });
    setError('');
    setShowModal(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const labData: LabFormData = {
        lab_name: formData.lab_name,
        location: formData.location || null,
        lab_in_charge: formData.lab_in_charge || null,
        dept_id: formData.dept_id || null,
      };

      if (editingLab) {
        await updateLaboratory(editingLab.lab_id, labData);
      } else {
        await createLaboratory(labData);
      }

      setShowModal(false);
      setEditingLab(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save laboratory');
    } finally {
      setLoading(false);
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

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Registered Laboratories
            </CardTitle>
            {user?.role === 'Admin' && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add Laboratory
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : labs.length === 0 ? (
            <div className="text-center py-8">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No laboratories found</p>
              {user?.role === 'Admin' && (
                <Button className="mt-4" onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Laboratory
                </Button>
              )}
            </div>
          ) : (
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
                      Lab In Charge (Custodian)
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
                          <span className="text-gray-400">
                            {lab.lab_in_charge || 'No custodian assigned'}
                          </span>
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
          )}
        </CardContent>
      </Card>

      {/* Custom Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40"></div>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {editingLab ? 'Edit Laboratory' : 'Add New Laboratory'}
                  </h3>
                  <button
                    type="button"
                    className="text-white hover:text-gray-200 transition-colors"
                    onClick={() => {
                      setShowModal(false);
                      setEditingLab(null);
                      setError('');
                    }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="lab_name">Laboratory Name</Label>
                    <Input
                      id="lab_name"
                      type="text"
                      placeholder="Enter laboratory name"
                      value={formData.lab_name}
                      onChange={(e) => setFormData({...formData, lab_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="Enter location"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lab_in_charge">Lab In Charge</Label>
                    <Input
                      id="lab_in_charge"
                      type="text"
                      placeholder="Enter lab in charge"
                      value={formData.lab_in_charge || ''}
                      onChange={(e) => setFormData({...formData, lab_in_charge: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowModal(false);
                        setEditingLab(null);
                        setError('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : (editingLab ? 'Update' : 'Create')}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LaboratoriesPage;
