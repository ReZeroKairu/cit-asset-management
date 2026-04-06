import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getLabRequests,
  getEquipmentBorrows,
  getSoftwareInstallations,
} from "../api/forms";
import { type FormSubmission } from "../types/forms";

export const useFormsData = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const transformFormData = (data: any[], type: string): FormSubmission[] => {
    return data.map((item: any) => {
      const baseTransform = {
        id: type === "lab-request" ? item.request_id :
             type === "equipment-borrow" ? item.borrow_id :
             type === "software-install" ? item.id :
             item.formId || item.id,
        type: type as any,
        date: item.date,
        name: type === "lab-request" ? item.faculty_student_name :
              type === "equipment-borrow" ? item.faculty_student_name :
              type === "software-install" ? item.faculty_name || item.faculty_student_name :
              item.faculty_student_name || item.faculty_name || "One-Time Form User",
        status: item.status,
        laboratory: item.laboratory || "",
        purpose: type === "software-install" ? item.software_list : item.purpose || "",
        createdAt: item.created_at,
        userId: item.user_id ?? item.users?.id,
        details: item,
      };
      return baseTransform;
    });
  };

  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);

      const [
        labRequestsRes,
        equipmentBorrowsRes,
        softwareInstallationsRes,
      ] = await Promise.all([
        getLabRequests({}),
        getEquipmentBorrows({}),
        getSoftwareInstallations({}),
      ]);

      const labRequests = Array.isArray(labRequestsRes) ? labRequestsRes : labRequestsRes?.data || [];
      const equipmentBorrows = Array.isArray(equipmentBorrowsRes) ? equipmentBorrowsRes : equipmentBorrowsRes?.data || [];
      const softwareInstallations = Array.isArray(softwareInstallationsRes) ? softwareInstallationsRes : softwareInstallationsRes?.data || [];

      const labRequestsData = transformFormData(labRequests, "lab-request");
      const equipmentBorrowsData = transformFormData(equipmentBorrows, "equipment-borrow");
      const softwareInstallationsData = transformFormData(softwareInstallations, "software-install");

      const allForms: FormSubmission[] = [
        ...labRequestsData,
        ...equipmentBorrowsData,
        ...softwareInstallationsData,
      ];

      const userForms = (() => {
        if (user?.role === "Admin") {
          return allForms.filter(
            (form) =>
              form.status === "Custodian_Approved" &&
              form.type !== "software-install"
          );
        }

        if (user?.role === "Custodian") {
          return allForms
            .filter(
              (form) =>
                form.userId === user?.id
            )
            .filter(
              (form) =>
                form.status !== "Completed" &&
                form.status !== "Returned" &&
                form.status !== "Denied" &&
                form.status !== "Lost"
            );
        }

        return allForms.filter((form) => form.status === "Pending");
      })();

      setForms(
        userForms.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (user && user.id) {
      fetchForms();
    }
  }, [user?.id, user?.role, fetchForms]);

  return {
    forms,
    loading,
    refetchForms: fetchForms,
  };
};
