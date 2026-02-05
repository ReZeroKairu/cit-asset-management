//frontend/src/pages/AssignmentsPage.tsx
import React, { useState, useEffect } from "react";
import {
  getAllUsersWithAssignments,
  assignUserToLab,
  getLaboratories,
} from "../api/assignments";

interface User {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
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

const AssignmentsPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, labsData] = await Promise.all([
        getAllUsersWithAssignments(),
        getLaboratories(),
      ]);
      setUsers(usersData);
      setLaboratories(labsData);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentChange = async (
    userId: number,
    labId: number | null,
  ) => {
    try {
      // If assigning to a lab, check if user is a custodian and lab already has one
      if (labId !== null) {
        const user = users.find((u) => u.user_id === userId);
        if (user?.role === "Custodian") {
          const existingCustodian = users.find(
            (u) =>
              u.lab_id === labId &&
              u.role === "Custodian" &&
              u.user_id !== userId,
          );

          if (existingCustodian) {
            setError(
              `Cannot assign ${user.full_name} to this laboratory. ${existingCustodian.full_name} is already assigned as the custodian.`,
            );
            return;
          }
        }
      }

      await assignUserToLab(userId, labId);
      await loadData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update assignment");
    }
  };

  const getAssignmentStatus = (user: User) => {
    if (user.assigned_lab) {
      return {
        status: "assigned",
        labName: user.assigned_lab.lab_name,
        location: user.assigned_lab.location,
      };
    }
    return {
      status: "unassigned",
      labName: "Not Assigned",
      location: "",
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Laboratory Assignments
        </h1>
        <p className="text-gray-600 mt-1">
          Manage custodian assignments to laboratories
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              User Laboratory Assignments
            </h3>
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
                {users.map((user) => {
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
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === "Admin"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {assignment.status === "assigned" ? (
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
                          value={user.lab_id || ""}
                          onChange={(e) =>
                            handleAssignmentChange(
                              user.user_id,
                              e.target.value ? parseInt(e.target.value) : null,
                            )
                          }
                        >
                          <option value="">Select Laboratory</option>
                          <option value="">-- Remove Assignment --</option>
                          {laboratories.map((lab) => (
                            <option key={lab.lab_id} value={lab.lab_id}>
                              {lab.lab_name}{" "}
                              {lab.location && `(${lab.location})`}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {users.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <p className="mt-2 text-gray-500">No users found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
