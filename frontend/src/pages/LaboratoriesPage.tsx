import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getLaboratories, createLaboratory, updateLaboratory, deleteLaboratory } from "../api/laboratories";
import api from "../api/axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Plus, Edit, Trash2, Building } from "lucide-react";

interface Laboratory {
  lab_id: number;
  lab_name: string;
  location?: string | null;
  dept_id?: number | null;
  lab_in_charge?: string | null;
}

interface Department {
  dept_id: number;
  dept_name: string;
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [labsData, orgData] = await Promise.all([
        getLaboratories(),
        api.get('/organization-data')
      ]);
      setLabs(labsData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingLab(null);
    setShowModal(true);
  };

  const handleEdit = (lab: Laboratory) => {
    setEditingLab(lab);
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
        lab_name: editingLab?.lab_name || '',
        location: editingLab?.location || null,
        lab_in_charge: editingLab?.lab_in_charge || null,
        dept_id: editingLab?.dept_id || null,
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
              <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Laboratory
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingLab ? 'Edit Laboratory' : 'Add New Laboratory'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
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
                        value={editingLab?.lab_name || ''}
                        onChange={(e) => setEditingLab(editingLab ? {...editingLab, lab_name: e.target.value} : null)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        type="text"
                        placeholder="Enter location"
                        value={editingLab?.location || ''}
                        onChange={(e) => setEditingLab(editingLab ? {...editingLab, location: e.target.value} : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lab_in_charge">Lab In Charge</Label>
                      <Input
                        id="lab_in_charge"
                        type="text"
                        placeholder="Enter lab in charge"
                        value={editingLab?.lab_in_charge || ''}
                        onChange={(e) => setEditingLab(editingLab ? {...editingLab, lab_in_charge: e.target.value} : null)}
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
                </DialogContent>
              </Dialog>
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
                      Lab In Charge
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
                        {lab.lab_in_charge || 'N/A'}
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
    </div>
  );
};

export default LaboratoriesPage;
