import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getSoftwareInstallations,
} from "../api/forms";
import { type FormSubmission } from "../types/forms";

export const useFormsData = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const transformFormData = (data: any[]): FormSubmission[] => {
    return data.map((item: any) => {
      const baseTransform = {
        id: item.id || item.formId,
        type: "software-install" as any,
        date: item.date,
        name: item.faculty_name || item.faculty_student_name || "One-Time Form User",
        status: item.status,
        laboratory: item.laboratory || "",
        purpose: item.software_list || "",
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

      const [softwareInstallationsRes] = await Promise.all([
        getSoftwareInstallations({}),
      ]);

      const softwareInstallations = Array.isArray(softwareInstallationsRes) ? softwareInstallationsRes : softwareInstallationsRes?.data || [];

      const softwareInstallationsData = transformFormData(softwareInstallations);

      const allForms: FormSubmission[] = [
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
                form.status !== "Denied"
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

  // Add periodic polling for new submissions
  useEffect(() => {
    const interval = setInterval(() => {
      // Only fetch if page is visible and user is authenticated
      if (!document.hidden && user && user.id) {
        fetchForms();
      }
    }, 1800000); // Check for new submissions every 30 minutes

    return () => clearInterval(interval);
  }, [user?.id, fetchForms]);

  // Add immediate refresh when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && user.id) {
        fetchForms();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, fetchForms]);

  return {
    forms,
    loading,
    refetchForms: fetchForms,
  };
};
