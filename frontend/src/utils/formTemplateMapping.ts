//frontend/src/utils/formTemplateMapping.ts
import { generateTemplateReport } from './generateTemplateReport';

// Smart form type detection based on data content
const detectFormType = (formData: any): string => {
  // If form type is explicitly provided and valid, use it
  if (formData.type && FORM_TEMPLATES[formData.type as keyof typeof FORM_TEMPLATES]) {
    return formData.type;
  }
  
  // Smart detection based on data content
  const data = formData.details || formData;
  
  // Check for equipment borrow indicators
  if (data.equipment_list || data.equipment_items || data.releaseTime || data.returnedTime) {
    // Check if equipment_list contains equipment data structure
    const equipmentData = data.equipment_list || data.equipment_items;
    if (equipmentData) {
      if (typeof equipmentData === 'string') {
        try {
          const parsed = JSON.parse(equipmentData);
          if (Array.isArray(parsed) && parsed.some((item: any) => item.unitQty && item.equipmentName)) {
            return 'equipment-borrow';
          }
        } catch {
          // If JSON parse fails, check for equipment keywords
          if (equipmentData.toLowerCase().includes('equipment') || 
              equipmentData.toLowerCase().includes('borrow')) {
            return 'equipment-borrow';
          }
        }
      } else if (Array.isArray(equipmentData)) {
        if (equipmentData.some((item: any) => item.unitQty && item.equipmentName)) {
          return 'equipment-borrow';
        }
      }
    }
    
    // Check for borrow-specific fields
    if (data.releaseTime || data.returnedTime || data.borrow_date) {
      return 'equipment-borrow';
    }
  }
  
  // Check for software install indicators
  if (data.software_list || data.installation_date || data.license_required || data.installation_purpose) {
    return 'software-install';
  }
  
  // Check for lab request indicators
  if (data.usage_type || data.time_in || data.time_out || data.ws_number || data.printing_pages) {
    return 'lab-request';
  }
  
  // Default fallback - check purpose field for clues
  if (data.purpose) {
    const purpose = data.purpose.toLowerCase();
    if (purpose.includes('borrow') || purpose.includes('equipment')) {
      return 'equipment-borrow';
    }
    if (purpose.includes('install') || purpose.includes('software')) {
      return 'software-install';
    }
    if (purpose.includes('lab') || purpose.includes('reservation') || purpose.includes('printing')) {
      return 'lab-request';
    }
  }
  
  // Ultimate fallback - use lab request as it's most common
  return 'lab-request';
};

// Map form types to their template files
export const FORM_TEMPLATES = {
  'lab-request': '/LDCU-Forms-CIT-034-Laboratory and E-Forum Usage Request.docx',
  'equipment-borrow': '/LDCU-Forms-CIT-033-Laboratoty Borrowing of Equipment.docx',
  'software-install': '/LDCU-Forms-CIT-035-Laboratory Software Installation Request.docx',
  'one-time-submission': '/LDCU-Forms-CIT-034-Laboratory and E-Forum Usage Request.docx', // Default to lab request
};

// Map form data to template variables
export const mapFormDataToTemplate = (formData: any) => {
  console.log("Mapping form data:", formData);
  
  // Map usage type for display
  const getDisplayUsageType = (usageType: string) => {
    switch (usageType) {
      case 'set-in-reservation':
        return 'Set-in/Reservation';
      case 'printing':
        return 'Printing';
      default:
        return usageType;
    }
  };

  // Format laboratory name for display
  const formatLaboratoryName = (labName: string) => {
    if (!labName) return '';
    
    // Handle different lab name formats
    switch (labName.toLowerCase()) {
      case 'lab1':
        return 'Laboratory 1';
      case 'lab2':
        return 'Laboratory 2';
      case 'cit-cisco-lab':
        return 'Cisco';
      case 'e-forum':
        return 'E-Forum';
      default:
        // Capitalize first letter of each word for other lab names
        return labName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Format date for display
  const formatDate = (dateInput: any) => {
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
    usage_type: getDisplayUsageType(formData.details?.usage_type || formData.usage_type || 'printing'),
    faculty_student_name: formData.name || formData.faculty_student_name || formData.details?.faculty_student_name || '',
    year_level: formData.details?.year_level || '',
    laboratory: formatLaboratoryName(formData.laboratory || formData.details?.laboratory || ''),
    printing_pages: formData.details?.printing_pages || '',
    ws_number: formData.details?.ws_number || '',
    time_in: formData.details?.time_in || '',
    time_out: formData.details?.time_out || '',
    purpose: formData.purpose || formData.details?.purpose || '',
    requested_by: formData.details?.requested_by || formData.requested_by || '',
    approved_by: formData.details?.approved_by || 'DR. MARCO MARVIN L. RADO',
    remarks: formData.details?.remarks || '',
    monitored_by: formData.details?.monitored_by || '',
  };

  // Form-specific data
  switch (formData.type) {
    case 'lab-request':
      return {
        ...baseData,
        course_code: formData.details?.course_code || '',
        year_section: formData.details?.year_section || '',
        number_of_students: formData.details?.number_of_students || '',
        schedule: formData.details?.schedule || '',
        software_needed: formData.details?.software_needed || '',
        additional_requirements: formData.details?.additional_requirements || '',
      };

    case 'equipment-borrow':
      const equipmentData = formData.details?.equipment_list || formData.equipment_list || [];
      let unitQtys: string[] = [];
      let equipmentNames: string[] = [];
      
      if (equipmentData) {
        let items: any[] = [];
        if (typeof equipmentData === 'string') {
          try {
            items = JSON.parse(equipmentData);
          } catch {
            // If parsing fails, treat as plain text
            items = [{ unitQty: '', equipmentName: equipmentData }];
          }
        } else if (Array.isArray(equipmentData)) {
          items = equipmentData;
        }
        
        unitQtys = items.map((item: any) => item.unitQty || '');
        equipmentNames = items.map((item: any) => item.equipmentName || '');
      }
      
      // Create individual placeholders for each equipment item (up to 10 items)
      const equipmentPlaceholders: any = {};
      const maxItems = Math.min(unitQtys.length, 10);
      
      for (let i = 0; i < maxItems; i++) {
        equipmentPlaceholders[`unitQty_${i + 1}`] = unitQtys[i] || '';
        equipmentPlaceholders[`equipmentName_${i + 1}`] = equipmentNames[i] || '';
      }
      
      // Fill remaining placeholders with empty strings
      for (let i = maxItems + 1; i <= 10; i++) {
        equipmentPlaceholders[`unitQty_${i}`] = '';
        equipmentPlaceholders[`equipmentName_${i}`] = '';
      }
      
      return {
        ...baseData,
        // Original column-based placeholders (for backward compatibility)
        unitQty_column: unitQtys.join('\n'),
        equipmentName_column: equipmentNames.join('\n'),
        // Individual item placeholders for flexible layout
        ...equipmentPlaceholders,
        // Keep nested structure for backward compatibility
        equipment_items: {
          unitQty_column: unitQtys.join('\n'),
          equipmentName_column: equipmentNames.join('\n')
        },
        // Add count for template logic
        equipment_count: maxItems.toString(),
        borrow_date: formatDate(formData.details?.borrow_date || formData.date || ''),
        return_date: formatDate(formData.details?.return_date || ''),
        release_time: (() => {
          const time24 = formData.details?.releaseTime || formData.releaseTime || '';
          if (!time24) return '';
          
          let hours: number, minutes: string;
          if (time24.includes(':')) {
            const parts = time24.split(':');
            hours = parseInt(parts[0]);
            minutes = parts[1];
          } else {
            hours = parseInt(time24.substring(0, 2));
            minutes = time24.substring(2);
          }
          
          const period = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          
          return `${displayHours}:${minutes.padStart(2, '0')} ${period}`;
        })(),
        returned_time: (() => {
          const time24 = formData.details?.returnedTime || formData.returnedTime || '';
          if (!time24) return '';
          
          let hours: number, minutes: string;
          if (time24.includes(':')) {
            const parts = time24.split(':');
            hours = parseInt(parts[0]);
            minutes = parts[1];
          } else {
            hours = parseInt(time24.substring(0, 2));
            minutes = time24.substring(2);
          }
          
          const period = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          
          return `${displayHours}:${minutes.padStart(2, '0')} ${period}`;
        })(),
        purpose_of_use: formData.details?.purpose_of_use || formData.purpose || '',
      };

    case 'software-install':
      return {
        ...baseData,
        faculty_name: formData.details?.faculty_name || formData.facultyName || '',
        date: formatDate(formData.details?.date || formData.date || ''),
        laboratory: formatLaboratoryName(formData.details?.laboratory || formData.laboratory || ''),
        software_list: formData.details?.software_list || formData.softwareList || '',
        requested_by: formData.details?.requested_by || formData.requestedBy || '',
        // Use prepared_by as approved_by for display (database has prepared_by field)
        approved_by: formData.details?.approved_by || formData.approvedBy || formData.preparedBy || 'DR. MARCO MARVIN L. RADO',
        // Add prepared_by field for template (ALL CAPS)
        prepared_by: (formData.details?.prepared_by || formData.preparedBy || formData.approvedBy || 'DR. MARCO MARVIN L. RADO').toUpperCase(),
        // Handle feedback date formatting
        feedback_date: (() => {
          const date = formData.details?.feedback_date || formData.feedbackDate || '';
            if (!date) return '';
            
            if (typeof date === 'string') {
              if (date.includes('T')) {
                const parsedDate = new Date(date);
                return parsedDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                });
              } else {
                return date; // Return as-is if no T
              }
            } else if (date instanceof Date) {
              return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              });
            }
            
            return '';
          })(),
      };

    case 'one-time-submission':
      return {
        ...baseData,
        form_type: formData.details?.formType || 'Laboratory Request',
        additional_info: formData.details?.additional_info || '',
      };

    default:
      return baseData;
  }
};

// Generate form document
export const generateFormDocument = async (formData: any) => {
  try {
    // Use smart detection to determine correct form type
    const detectedType = detectFormType(formData);
    const templatePath = FORM_TEMPLATES[detectedType as keyof typeof FORM_TEMPLATES];
    
    if (!templatePath) {
      throw new Error(`No template found for detected form type: ${detectedType}`);
    }

    console.log(`Smart detection: Form type detected as '${detectedType}', using template: ${templatePath}`);

    // Use the detected form type to get proper field mapping
    const templateData = mapFormDataToTemplate({...formData, type: detectedType});
    
    const fileName = `${detectedType.replace('-', '_')}_request_${formData.id || Date.now()}.docx`;
    
    await generateTemplateReport(templatePath, templateData, fileName);
  } catch (error) {
    console.error('Error generating form document:', error);
    throw error;
  }
};
