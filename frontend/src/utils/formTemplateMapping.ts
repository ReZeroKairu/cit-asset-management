//frontend/src/utils/formTemplateMapping.ts
import { generateTemplateReport } from './generateTemplateReport';

// Smart form type detection based on data content
export const detectFormType = (formData: any): string => {
  // Smart detection based on data content
  const data = formData.details || formData;

  // Check for user type at both root level and in details
  const resolvedUserType = data.userType || data.user_type || formData.userType || formData.user_type;
  
  // Normalize user type for comparison (handle case differences)
  const normalizedUserType = resolvedUserType?.toLowerCase();
  
  console.log('🔍 Template Detection Debug:', {
    formData,
    data,
    resolvedUserType,
    normalizedUserType,
    usage_type: data.usage_type,
    user_type: data.user_type,
    userType: data.userType,
    printing_pages: data.printing_pages,
    'formData.userType': formData.userType,
    'formData.user_type': formData.user_type,
    'formData.type': formData.type,
    'hasDetails': !!formData.details,
    'detailsKeys': formData.details ? Object.keys(formData.details) : []
  });
  
  // If form type is explicitly provided and valid, check if we need to use faculty variant
  if (formData.type && FORM_TEMPLATES[formData.type as keyof typeof FORM_TEMPLATES]) {
    // Check if we should use faculty variant
    if (normalizedUserType === 'faculty') {
      if (formData.type.toLowerCase() === 'equipment-borrow') {
        return 'equipment-borrow-faculty';
      } else if (formData.type.toLowerCase() === 'lab-request') {
        // Don't return immediately - let smart detection handle printing vs set-in-reservation
        // Continue to smart detection below
      } else {
        return formData.type;
      }
    } else {
      // For students, continue with smart detection for lab-request to handle printing vs set-in-reservation
      if (formData.type.toLowerCase() === 'lab-request') {
        // Don't return immediately - let smart detection handle student + printing
        // Continue to smart detection below
      } else {
        return formData.type;
      }
    }
  }
  
  // Check for lab request indicators FIRST (priority over equipment borrow)
  if (data.usage_type || data.time_in || data.time_out || data.ws_number || data.printing_pages) {
    console.log('✅ Lab Request Detection - Usage Type:', data.usage_type, 'User Type:', resolvedUserType, 'Normalized:', normalizedUserType);
    
    // Check if it's faculty lab request
    if (normalizedUserType === 'faculty') {
      // Check specifically for printing usage type
      if (data.usage_type === 'printing') {
        console.log('🎯 Detected: Faculty + Printing');
        return 'lab-request-faculty-printing';
      }
      return 'lab-request-faculty';
    }
    // Check if it's student lab request with printing
    if (normalizedUserType === 'student') {
      console.log('🎯 Student detected, checking usage type:', data.usage_type);
      // Check specifically for printing usage type
      if (data.usage_type === 'printing') {
        console.log('🎯 Detected: Student + Printing');
        return 'lab-request-student-printing';
      } else {
        console.log('❌ Student but not printing, usage_type:', data.usage_type);
      }
    } else {
      console.log('❌ Not student, normalizedUserType:', normalizedUserType);
    }
    console.log('🔍 Default: Lab Request');
    return 'lab-request';
  } else {
    console.log('❌ No lab request indicators found:', {
      usage_type: data.usage_type,
      time_in: data.time_in,
      time_out: data.time_out,
      ws_number: data.ws_number,
      printing_pages: data.printing_pages
    });
  }
  
  // Check for software install indicators
  if (data.software_list || data.installation_date || data.license_required || data.installation_purpose) {
    return 'software-install';
  }
  
  // Check for equipment borrow indicators (only if no lab request indicators found)
  if (data.equipment_list || data.equipment_items || data.releaseTime || data.returnedTime) {
    console.log('⚠️ Equipment borrow indicators found:', {
      equipment_list: data.equipment_list,
      equipment_items: data.equipment_items,
      releaseTime: data.releaseTime,
      returnedTime: data.returnedTime,
      'This should not happen for lab requests!': 'Check form data structure'
    });
    
    // Check if equipment_list contains equipment data structure
    const equipmentData = data.equipment_list || data.equipment_items;
    if (equipmentData) {
      if (typeof equipmentData === 'string') {
        try {
          const parsed = JSON.parse(equipmentData);
          if (Array.isArray(parsed) && parsed.some((item: any) => item.unitQty && item.equipmentName)) {
            const result = normalizedUserType === 'faculty' ? 'equipment-borrow-faculty' : 'equipment-borrow';
            console.log('⚠️ Returning equipment borrow result:', result);
            return result;
          }
        } catch {
          // If JSON parse fails, check for equipment keywords
          if (equipmentData.toLowerCase().includes('equipment') || 
              equipmentData.toLowerCase().includes('borrow')) {
            const result = normalizedUserType === 'faculty' ? 'equipment-borrow-faculty' : 'equipment-borrow';
            console.log('⚠️ Returning equipment borrow result (keywords):', result);
            return result;
          }
        }
      } else if (Array.isArray(equipmentData)) {
        if (equipmentData.some((item: any) => item.unitQty && item.equipmentName)) {
          const result = normalizedUserType === 'faculty' ? 'equipment-borrow-faculty' : 'equipment-borrow';
          console.log('⚠️ Returning equipment borrow result (array):', result);
          return result;
        }
      }
    }
    
    // Check for borrow-specific fields
    if (data.releaseTime || data.returned_time || data.borrow_date) {
      const result = normalizedUserType === 'faculty' ? 'equipment-borrow-faculty' : 'equipment-borrow';
      console.log('⚠️ Returning equipment borrow result (time fields):', result);
      return result;
    }
    
    console.log('⚠️ Equipment borrow indicators found but no valid equipment data, continuing to lab request detection...');
  }
  
  // Default fallback - check purpose field for clues
  if (data.purpose) {
    const purpose = data.purpose.toLowerCase();
    if (purpose.includes('borrow') || purpose.includes('equipment')) {
      // Check if it's faculty equipment borrow
      if (normalizedUserType === 'faculty') {
        return 'equipment-borrow-faculty';
      }
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
  'lab-request-faculty': '/LDCU-Forms-CIT-034-Laboratory and E-Forum Usage Request Faculty.docx',
  'lab-request-faculty-printing': '/LDCU-Forms-CIT-034-Laboratory Printing Usage Request Faculty.docx',
  'lab-request-student-printing': '/LDCU-Forms-CIT-034-Laboratory Printing Usage Request.docx',
  'equipment-borrow': '/LDCU-Forms-CIT-033-Laboratory Borrowing of Equipment.docx',
  'equipment-borrow-faculty': '/LDCU-Forms-CIT-033-Laboratory Borrowing of Equipment Faculty.docx',
  'software-install': '/LDCU-Forms-CIT-035-Laboratory Software Installation Request.docx',
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

    case 'lab-request-faculty':
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

    case 'equipment-borrow-faculty':
      const facultyEquipmentData = formData.details?.equipment_list || formData.equipment_list || [];
      let facultyUnitQtys: string[] = [];
      let facultyEquipmentNames: string[] = [];
      
      if (facultyEquipmentData) {
        let items: any[] = [];
        if (typeof facultyEquipmentData === 'string') {
          try {
            items = JSON.parse(facultyEquipmentData);
          } catch {
            // If parsing fails, treat as plain text
            items = [{ unitQty: '', equipmentName: facultyEquipmentData }];
          }
        } else if (Array.isArray(facultyEquipmentData)) {
          items = facultyEquipmentData;
        }
        
        facultyUnitQtys = items.map((item: any) => item.unitQty || '');
        facultyEquipmentNames = items.map((item: any) => item.equipmentName || '');
      }
      
      // Create individual placeholders for each equipment item (up to 10 items)
      const facultyEquipmentPlaceholders: any = {};
      const facultyMaxItems = Math.min(facultyUnitQtys.length, 10);
      
      for (let i = 0; i < facultyMaxItems; i++) {
        facultyEquipmentPlaceholders[`unitQty_${i + 1}`] = facultyUnitQtys[i] || '';
        facultyEquipmentPlaceholders[`equipmentName_${i + 1}`] = facultyEquipmentNames[i] || '';
      }
      
      // Fill remaining placeholders with empty strings
      for (let i = facultyMaxItems + 1; i <= 10; i++) {
        facultyEquipmentPlaceholders[`unitQty_${i}`] = '';
        facultyEquipmentPlaceholders[`equipmentName_${i}`] = '';
      }
      
      return {
        ...baseData,
        // Original column-based placeholders (for backward compatibility)
        unitQty_column: facultyUnitQtys.join('\n'),
        equipmentName_column: facultyEquipmentNames.join('\n'),
        // Individual item placeholders for flexible layout
        ...facultyEquipmentPlaceholders,
        // Keep nested structure for backward compatibility
        equipment_items: {
          unitQty_column: facultyUnitQtys.join('\n'),
          equipmentName_column: facultyEquipmentNames.join('\n')
        },
        // Add count for template logic
        equipment_count: facultyMaxItems.toString(),
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
      const mappedData = {
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
        // Add missing remarks field - use installation_remarks to match Word template
        installation_remarks: formData.details?.installation_remarks || formData.installationRemarks || '',
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
      
      return mappedData;


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
    
    console.log('🎯 Final Template Selection:', {
      detectedType,
      templatePath,
      formData
    });
    
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
