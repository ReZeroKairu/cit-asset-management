// Generate complaint number in format: CPYYMMXXXX
// YY = last 2 digits of year, MM = month, XXXX = padded complaint ID
export const generateComplaintNumber = (complaintId?: number): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const id = complaintId ? complaintId.toString().padStart(4, '0') : '0000';
  return `CP${year}${month}${id}`;
};
