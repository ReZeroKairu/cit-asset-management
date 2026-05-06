import { useCallback } from "react";
import {
  updateSoftwareInstallationStatus as apiUpdateSoftwareInstallationStatus,
} from "../api/forms";

export const useFormStatus = (onSuccess?: () => void, selectedForms?: Set<string>) => {
  const updateStatus = useCallback(
    async (formId: number, formType: string, newStatus: string) => {
      try {
        console.log(`🔄 Updating status for ${formType} ID ${formId} to ${newStatus}`);

        switch (formType) {
          case "software-install":
            await apiUpdateSoftwareInstallationStatus(formId, newStatus);
            break;
          default:
            throw new Error(`Unsupported form type: ${formType}`);
        }

        console.log(`✅ Successfully updated status to ${newStatus}`);
        onSuccess?.();
      } catch (error) {
        console.error("❌ Error updating status:", error);
        console.error("Error details:", {
          formId,
          formType,
          newStatus,
          error: error instanceof Error ? error.message : error,
          response: (error as any)?.response?.data,
          status: (error as any)?.response?.status
        });

        const errorMessage = (error as any)?.response?.data?.message ||
                           (error as any)?.response?.data?.error ||
                           "Failed to update status. Please try again.";

        alert(`Error updating status: ${errorMessage}`);
      }
    },
    [onSuccess]
  );

  const handleBulkApprove = useCallback(async () => {
    if (!selectedForms || selectedForms.size === 0) return;

    try {
      console.log('Bulk approving forms:', Array.from(selectedForms));
      const approvalPromises = Array.from(selectedForms).map((formIdStr) => {
        const parts = formIdStr.split("-");
        const idStr = parts[parts.length - 1];
        const formType = parts.slice(0, -1).join("-");
        const formId = parseInt(idStr);

        if (formType === "software-install") {
          return Promise.resolve();
        }

        switch (formType) {
          case "software-install":
            return apiUpdateSoftwareInstallationStatus(formId, "Custodian_Approved");
          default:
            console.error("Unknown form type:", formType);
            return Promise.resolve();
        }
      });

      await Promise.all(approvalPromises);
      console.log('Bulk approval completed successfully');
      
      onSuccess?.();
      alert(`Successfully approved ${selectedForms.size} forms!`);
    } catch (error) {
      console.error("Error during bulk approval:", error);
      alert("Error during bulk approval. Please try again.");
    }
  }, [selectedForms, onSuccess]);

  return {
    updateStatus,
    handleBulkApprove,
  };
};
