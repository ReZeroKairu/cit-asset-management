//frontend/src/api/assignments.ts
import api from "./axios";

// Get all users with their laboratory assignments (Admin only)
export const getAllUsersWithAssignments = async () => {
  const response = await api.get("/users/assignments");
  return response.data;
};

// Assign user to laboratory (Admin only)
export const assignUserToLab = async (userId: number, labId: number | null) => {
  const response = await api.put("/users/assign-lab", {
    userId,
    labId,
  });
  return response.data;
};

// Get laboratories for dropdown
export const getLaboratories = async () => {
  const response = await api.get("/users/organization-data");
  return response.data.laboratories;
};
