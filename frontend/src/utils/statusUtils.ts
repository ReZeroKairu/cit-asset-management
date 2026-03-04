// Shared utility for calculating system status based on component priorities
// Matches backend logic in maintenanceController.ts

export const STATUS_PRIORITY: Record<string, number> = {
  'Lost': 4,
  'For Replacement': 3,
  'For Repair': 2,
  'For Upgrade': 1,
  'Functional': 0,
  'Working': 0,
  'Operational': 0
};

/**
 * Calculate the worst (highest priority) status from an array of assets
 * @param assets - Array of assets with status property
 * @returns The worst status among all assets
 */
export const calculateWorstStatus = (assets: Array<{ status: string; unit_name?: string }>): string => {
  if (!assets || assets.length === 0) {
    return 'Functional';
  }

  let worstStatus = 'Functional';
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
  return ['Functional', 'Working', 'Operational'].includes(status);
};
