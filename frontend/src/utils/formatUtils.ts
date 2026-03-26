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
    case 'printing':
      return 'Printing';
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
    case 'hardware-lab':
    case 'hardware_lab':
      return 'Hardware Lab';
    case 'software-lab':
    case 'software_lab':
      return 'Software Lab';
    case 'network-lab':
    case 'network_lab':
      return 'Network Lab';
    case 'multimedia-lab':
    case 'multimedia_lab':
      return 'Multimedia Lab';
    default:
      // Replace both hyphens and underscores with spaces and capitalize each word
      return laboratory.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }
};
