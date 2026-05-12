//frontend/src/utils/formTemplateMapping.ts
import { generateTemplateReport } from './generateTemplateReport';

// Map form types to their template files
export const FORM_TEMPLATES = {
  'software-install': '/LDCU-Forms-CIT-035-Laboratory Software Installation Request.docx',
};

// Form data interface
interface FormData {
  type?: string;
  id?: string | number;
  form_id?: string | number;
  software_list?: string;
  details?: {
    software_list?: string;
    faculty_student_name?: string;
    faculty_name?: string;
    user_type?: string;
    usage_type?: string;
    purpose?: string;
    [key: string]: unknown;
  };
  request_id?: string | number;
  software_id?: string | number;
}

// Detect form type based on data structure and properties
export const detectFormType = (formData: FormData): string => {
  // If type is explicitly provided, use it
  if (formData.type) {
    return formData.type;
  }

  // Detect based on form_id pattern
  if (formData.form_id) {
    const formIdStr = formData.form_id.toString();
    if (formIdStr.includes('soft') || formIdStr.includes('software')) {
      return 'software-install';
    }
  }

  // Detect based on specific properties
  if (formData.software_list || formData.details?.software_list) {
    return 'software-install';
  }

  // Detect based on request_id pattern
  if (formData.request_id || formData.software_id) {
    return 'software-install';
  }

  // Default fallback
  return 'software-install';
};

// Form data interface for mapping
interface FormMappingData {
  type?: string;
  id?: string | number;
  date?: string | Date;
  details?: {
    date?: string | Date;
    faculty_name?: string;
    software_list?: string;
    laboratory?: string;
    date_needed?: string;
    time_needed?: string;
    course_code?: string;
    year_level?: string;
    feedback_date?: string | Date;
    requested_by?: string;
    approved_by?: string;
    remarks?: string;
    monitored_by?: string;
    installation_remarks?: string;
    prepared_by?: string;
  };
  name?: string;
  faculty_name?: string;
  software_list?: string;
  laboratory?: string;
}

// Map form data to template variables
export const mapFormDataToTemplate = (formData: FormMappingData) => {
  
  // Format date for display
  const formatDate = (dateInput: string | Date | undefined): string => {
    if (!dateInput) return new Date().toLocaleDateString();
    
    // Handle different date formats
    let date: Date;
    if (typeof dateInput === 'string') {
      // Handle ISO string format
      if (dateInput.includes('T')) {
        date = new Date(dateInput);
      } else {
        // Handle simple date string
        date = new Date(dateInput + 'T00:00:00.000Z');
      }
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      date = new Date();
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Common fields
  const baseData = {
    date: formatDate(formData.date || formData.details?.date),
    faculty_name: formData.name || formData.faculty_name || formData.details?.faculty_name || '',
    software_list: formData.details?.software_list || formData.software_list || '',
    laboratory: formData.details?.laboratory || formData.laboratory || '',
    date_needed: formData.details?.date_needed || '',
    time_needed: formData.details?.time_needed || '',
    course_code: formData.details?.course_code || '',
    year_level: formData.details?.year_level || '',
    installation_remarks: formData.details?.installation_remarks || '',
    prepared_by: formData.details?.prepared_by || '',
    feedback_date: (() => {
      const feedbackDate = formData.details?.feedback_date;
      if (!feedbackDate) return '';
      
      if (typeof feedbackDate === 'string') {
        if (feedbackDate.includes('T')) {
          const date = new Date(feedbackDate);
          return date.toISOString().split('T')[0];
        } else {
          return feedbackDate; // Return as-is if no T
        }
      } else if (feedbackDate instanceof Date) {
        return feedbackDate.toISOString().split('T')[0];
      }
      
      return '';
    })(),
    requested_by: formData.details?.requested_by || '',
    approved_by: '', // No approved_by field in database, leave empty
    remarks: formData.details?.remarks || '',
    monitored_by: formData.details?.monitored_by || '',
  };

  // Form-specific data
  switch (formData.type) {
    case 'software-install':
      return {
        ...baseData,
        approved_by: formData.details?.prepared_by || '', // For software install, approved_by is same as prepared_by
      };
    default:
      return baseData;
  }
};

// Generate form document
export const generateFormDocument = async (formData: FormData): Promise<void> => {
  try {
    // Use smart detection to determine correct form type
    const detectedType = detectFormType(formData);
    const templatePath = FORM_TEMPLATES[detectedType as keyof typeof FORM_TEMPLATES];
    
    if (!templatePath) {
      throw new Error(`No template found for detected form type: ${detectedType}`);
    }

    // Use the detected form type to get proper field mapping
    const templateData = mapFormDataToTemplate({...formData, type: detectedType});
    
    const fileName = `${detectedType.replace('-', '_')}_request_${formData.id || Date.now()}.docx`;
    
    await generateTemplateReport(templatePath, templateData, fileName);
  } catch (error) {
    console.error('Error generating form document:', error);
    throw error;
  }
};
