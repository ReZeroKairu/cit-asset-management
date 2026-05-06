/**
 * Utility functions for formatting form data
 */

export const formatUserType = (userType: string): string => {
  if (!userType) return '';
  
  // Replace both hyphens and underscores with spaces and capitalize
  return userType.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

export const formatUsageType = (usageType: string): string => {
  if (!usageType) return '';
  
  // Handle special cases
  switch (usageType.toLowerCase().replace(/[-_]/g, '-')) {
    case 'set-in-reservation':
      return 'Set-in/Reservation';
    default:
      // Replace both hyphens and underscores with spaces and capitalize
      return usageType.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }
};

export const formatLaboratory = (laboratory: string): string => {
  if (!laboratory) return '';
  
  // Handle special cases for laboratory names
  switch (laboratory.toLowerCase()) {
    case 'e-forum':
    case 'e_forum':
      return 'E-Forum';
    default:
      // Replace both hyphens and underscores with spaces and capitalize each word
      return laboratory.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }
};
