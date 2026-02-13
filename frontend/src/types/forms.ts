export interface FormSubmission {
  id: number;
  type: 'lab-request' | 'equipment-borrow' | 'software-install';
  date: string;
  name: string;
  status: string;
  laboratory: string;
  purpose: string;
  createdAt: string;
  userId?: number;
  details: any;
  // Form-specific ID fields
  request_id?: number;
  borrow_id?: number;
  software_id?: number;
}
