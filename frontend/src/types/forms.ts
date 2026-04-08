export interface FormSubmission {
  id: number;
  type: 'software-install';
  date: string;
  name: string;
  status: string;
  laboratory: string;
  purpose: string;
  createdAt: string;
  userId?: number;
  details: {
    faculty_student_name?: string;
    faculty_name?: string;
    user_type?: string;
    usage_type?: string;
    purpose?: string;
    [key: string]: unknown;
  };
  // Form-specific ID fields
  request_id?: number;
  borrow_id?: number;
  software_id?: number;
}
