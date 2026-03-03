//frontend/src/api/laboratories.ts
import api from "./axios";

// Get all laboratories
export const getLaboratories = async () => {
  const response = await api.get("/laboratories");
  return response.data;
};

// Create new laboratory (Admin only)
export const createLaboratory = async (labData: {
  lab_name: string;
  location?: string | null;
  dept_id?: number | null;
  lab_in_charge?: string | null;
}) => {
  const response = await api.post("/laboratories", labData);
  return response.data;
};

// Update laboratory (Admin only)
export const updateLaboratory = async (
  id: number,
  labData: {
    lab_name?: string;
    location?: string | null;
    dept_id?: number | null;
    lab_in_charge?: string | null;
  },
) => {
  const response = await api.put(`/laboratories/${id}`, labData);
  return response.data;
};

// Delete laboratory (Admin only)
export const deleteLaboratory = async (id: number) => {
  const response = await api.delete(`/laboratories/${id}`);
  return response.data;
};
