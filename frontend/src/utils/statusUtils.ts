// Shared utility for calculating system status based on component priorities
// Matches backend logic in maintenanceController.ts

export const STATUS_PRIORITY: Record<string, number> = {
  Lost: 4,
  "For Replacement": 3,
  "For Disposal": 2,
  "For Upgrade": 1,
  Functional: 0,
  Working: 0,
  Operational: 0,
};

/**
 * Calculate the worst (highest priority) status from an array of assets
 * @param assets - Array of assets with status property
 * @returns The worst status among all assets
 */
export const calculateWorstStatus = (
  assets: Array<{ status: string; unit_name?: string }>
): string => {
  if (!assets || assets.length === 0) {
    return "Functional";
  }

  let worstStatus = "Functional";
  let highestPriority = 0;

  for (const asset of assets) {
    const priority = STATUS_PRIORITY[asset.status] || 0;

    if (priority > highestPriority) {
      highestPriority = priority;
      worstStatus = asset.status;
    }
  }

  return worstStatus;
};

/**
 * Check if a status is considered functional/working
 * @param status - Status string to check
 * @returns True if status is functional
 */
export const isFunctionalStatus = (status: string): boolean => {
  return ["Functional", "Working", "Operational"].includes(status);
};

// Form status utilities

/**
 * Get color class for form status
 * @param status - Form status string
 * @returns CSS class for status color
 */
export const getFormStatusColor = (status: string): string => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "Custodian_Approved":
      return "bg-blue-100 text-blue-800";
    case "Admin_Approved":
      return "bg-green-100 text-green-800";
    case "Completed":
      return "bg-green-100 text-green-800";
    case "Denied":
      return "bg-red-100 text-red-800";
    case "Returned":
      return "bg-green-100 text-green-800";
    case "Lost":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
