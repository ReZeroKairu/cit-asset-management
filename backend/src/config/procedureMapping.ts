// Mapping between maintenance service procedures and DAR (Daily Activity Report) procedures
// This maps QPMC maintenance procedures to their corresponding DAR procedure IDs
// Based on actual database procedures from seed file

export const MAINTENANCE_TO_DAR_MAPPING: Record<string, number[]> = {
  // QPMC procedures → DAR procedures
  'Hardware Maintenance': [5], // QPMC procedure_id 8 → DAR procedure_id 5 (Hardware Checks)
  'Software Maintenance': [2], // QPMC procedure_id 9 → DAR procedure_id 2 (Software Checks)
  'Security Maintenance': [3], // QPMC procedure_id 10 → DAR procedure_id 3 (Security & Safety)
  'Network Maintenance': [4], // QPMC procedure_id 11 → DAR procedure_id 4 (Network & Connectivity)
  'Regular Cleaning': [6], // QPMC procedure_id 13 → DAR procedure_id 6 (Cleanliness & Organization)
  'System Performance': [3], // QPMC procedure_id 12 → DAR procedure_id 3 (Security & Safety)
  
  // Default fallback
  'default': [3] // Default to Security & Safety (procedure_id 3)
};

// Reverse mapping from DAR procedure IDs to maintenance service types
export const DAR_TO_MAINTENANCE_MAPPING: Record<number, string[]> = {
  1: [], // User Management - no direct maintenance equivalent
  2: ['Software Maintenance'], // Software Checks
  3: ['Security Maintenance', 'System Performance'], // Security & Safety
  4: ['Network Maintenance'], // Network & Connectivity
  5: ['Hardware Maintenance'], // Hardware Checks
  6: ['Regular Cleaning'], // Cleanliness & Organization
  7: [], // End of the day checks - no direct maintenance equivalent
};

// Function to get DAR procedure IDs from maintenance service type/procedure name
export function getDARProcedureIds(maintenanceProcedure: string): number[] {
  // Try exact match first
  if (MAINTENANCE_TO_DAR_MAPPING[maintenanceProcedure]) {
    return MAINTENANCE_TO_DAR_MAPPING[maintenanceProcedure];
  }
  
  // Try partial match (case-insensitive)
  const normalizedInput = maintenanceProcedure.toLowerCase();
  for (const [key, value] of Object.entries(MAINTENANCE_TO_DAR_MAPPING)) {
    if (key.toLowerCase().includes(normalizedInput) || normalizedInput.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Default to maintenance checks (procedure_id 3)
  return MAINTENANCE_TO_DAR_MAPPING['default'];
}

// Function to get maintenance service types from DAR procedure ID
export function getMaintenanceServiceTypes(darProcedureId: number): string[] {
  return DAR_TO_MAINTENANCE_MAPPING[darProcedureId] || [];
}
