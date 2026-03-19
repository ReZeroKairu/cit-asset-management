//frontend/src/api/auth.ts
import api from "./axios";

export const verifyUserPassword = async (password: string): Promise<boolean> => {
  try {
    const response = await api.post("/verify-password", { password });
    return response.data.valid === true;
  } catch (error: any) {
    console.error("Password verification failed:", error);
    return false;
  }
};
