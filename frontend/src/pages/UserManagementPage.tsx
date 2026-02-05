import { useState, useEffect } from "react";
import api from "../api/axios";
import EmbeddedCreateUserForm from "../components/EmbeddedCreateUserForm";
import EditUserModal from "../components/EditUserModal";
import { useAuth } from "../context/AuthContext";
import { getAllUsersWithAssignments, assignUserToLab, getLaboratories } from "../api/assignments";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";

interface User {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  lab_id: number | null;
  assigned_lab?: {
    lab_id: number;
    lab_name: string;
    location?: string;
  } | null;
}

interface Laboratory {
  lab_id: number;
  lab_name: string;
  location?: string;
}

interface CreateUserData {
  full_name: string;
  email: string;
  password: string;
  role: string;
  lab_id: string;
  selectedCampus: string;
  selectedOfficeType: string;
  selectedDept: string;
}

interface UserManagementPageProps {
  createUserData: CreateUserData;
  setCreateUserData: React.Dispatch<React.SetStateAction<CreateUserData>>;
}

const UserManagementPage: React.FC<UserManagementPageProps> = ({ createUserData, setCreateUserData }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'assignments' | 'create'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (user?.role === 'Admin') {
      loadData();
    }
  }, [user, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'users') {
        const res = await api.get("/users/assignments");
        setUsers(res.data);
      } else if (activeTab === 'assignments') {
        const [usersData, labsData] = await Promise.all([
          getAllUsersWithAssignments(),
          getLaboratories()
        ]);
        setUsers(usersData);
        setLaboratories(labsData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentChange = async (userId: number, labId: number | null) => {
    try {
      // If assigning to a lab, check if user is a custodian and lab already has one
      if (labId !== null) {
        const user = users.find(u => u.user_id === userId);
        if (user?.role === 'Custodian') {
          const existingCustodian = users.find(u => 
            u.lab_id === labId && 
            u.role === 'Custodian' && 
            u.user_id !== userId
          );
          
          if (existingCustodian) {
            setError(`Cannot assign ${user.full_name} to this laboratory. ${existingCustodian.full_name} is already assigned as the custodian.`);
            return;
          }
        }
      }
      
      await assignUserToLab(userId, labId);
      await loadData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update assignment');
    }
  };

  const handleUserCreated = () => {
    // Refresh users data and switch to users tab
    setActiveTab('users');
    loadData();
    
    // Reset create user form data
    setCreateUserData({
      full_name: "",
      email: "",
      password: "",
      role: "Custodian",
      lab_id: "",
      selectedCampus: "",
      selectedOfficeType: "",
      selectedDept: "",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800';
      case 'Custodian':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssignmentStatus = (user: User) => {
    if (user.assigned_lab) {
      return {
        status: 'assigned',
        labName: user.assigned_lab.lab_name,
        location: user.assigned_lab.location
      };
    }
    return {
      status: 'unassigned',
      labName: 'Not Assigned',
      location: ''
    };
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    // Refresh users data
    loadData();
    setEditingUser(null);
    setShowEditModal(false);
  };

  const handleEditClose = () => {
    setEditingUser(null);
    setShowEditModal(false);
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/users/${user.user_id}`);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  if (user?.role !== 'Admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to access user management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage system users and their laboratory assignments</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assignments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Assign Custodian
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Create User
          </button>
        </nav>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'users' && (
        <div>
          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Laboratory
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    {user?.role === 'Admin' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={user?.role === 'Admin' ? 6 : 5} className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={user?.role === 'Admin' ? 6 : 5} className="px-6 py-4 text-center text-gray-500">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((userItem) => (
                      <tr key={userItem.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {userItem.full_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {userItem.full_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userItem.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(userItem.role)}`}>
                            {userItem.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {userItem.assigned_lab ? (
                            <div>
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {userItem.assigned_lab.lab_name}
                              </span>
                              {userItem.assigned_lab.location && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {userItem.assigned_lab.location}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(userItem.created_at).toLocaleDateString()}
                        </td>
                        {user?.role === 'Admin' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditUser(userItem)}
                                className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteUser(userItem)}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">User Laboratory Assignments</h3>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Assignment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const assignment = getAssignmentStatus(user);
                    return (
                      <tr key={user.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'Admin' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {assignment.status === 'assigned' ? (
                            <div>
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                {assignment.labName}
                              </span>
                              {assignment.location && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {assignment.location}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              Not Assigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={user.lab_id || ''}
                            onChange={(e) => handleAssignmentChange(user.user_id, e.target.value ? parseInt(e.target.value) : null)}
                          >
                            <option value="">Select Laboratory</option>
                            <option value="">-- Remove Assignment --</option>
                            {laboratories.map((lab) => (
                              <option key={lab.lab_id} value={lab.lab_id}>
                                {lab.lab_name} {lab.location && `(${lab.location})`}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Create New User</h3>
          <EmbeddedCreateUserForm 
            onSuccess={handleUserCreated} 
            formData={createUserData}
            setFormData={setCreateUserData}
          />
        </div>
      )}

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={showEditModal}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default UserManagementPage;
