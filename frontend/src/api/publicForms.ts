// Dynamic API URL detection
export const getApiBaseUrl = () => {
  // Use network IP to avoid CORS loopback issues
  return 'http://172.72.100.78:3001';
};

const API_BASE_URL = getApiBaseUrl();
console.log('🌐 API_BASE_URL initialized to:', API_BASE_URL);

export interface PublicLabRequestData {
  date: string;
  usage_type: string;
  faculty_student_name: string;
  year_level?: string;
  laboratory: string;
  printing_pages?: string;
  ws_number?: string;
  time_in?: string;
  time_out?: string;
  purpose: string;
  requested_by: string;
  remarks?: string;
  monitored_by?: string;
  approved_by?: string;
}

export interface PublicEquipmentBorrowData {
  date: string;
  faculty_student_name: string;
  year_level?: string;
  laboratory: string;
  equipment_list: any[];
  purpose: string;
  release_time: string;
  returned_time?: string;
  requested_by: string;
  remarks?: string;
  monitored_by?: string;
  approved_by?: string;
}

export interface PublicSoftwareInstallationData {
  date: string;
  faculty_name: string;
  laboratory: string;
  software_list: string;
  requested_by: string;
  approved_by?: string;
  installation_remarks?: string;
  prepared_by?: string;
}

// Public Lab Request API
export const submitPublicLabRequest = async (data: PublicLabRequestData) => {
  console.log('🔍 Submitting Public Lab Request Data:', data);
  
  const response = await fetch(`${API_BASE_URL}/public-forms/lab-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  console.log('📤 Response status:', response.status);
  console.log('📥 Response ok:', response.ok);

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Error response:', error);
    console.error('📊 Error details:', {
      status: response.status,
      statusText: response.statusText,
      message: error.message,
      errors: error.errors
    });
    
    // Log individual validation errors if they exist
    if (error.errors && Array.isArray(error.errors)) {
      console.error('🔍 Individual validation errors:');
      error.errors.forEach((err: any, index: number) => {
        console.error(`  ${index + 1}. Field: ${err.field}, Message: ${err.message}`);
      });
    }
    
    // For rate limiting (429), throw the rate limit message directly
    if (response.status === 429) {
      throw new Error(error.error || 'Too many form submissions. Please try again in an hour.');
    }
    
    throw new Error(error.message || error.error || 'Failed to submit lab request');
  }

  const result = await response.json();
  console.log('✅ Success result:', result);
  return result;
};

// Public Equipment Borrow API
export const submitPublicEquipmentBorrow = async (data: PublicEquipmentBorrowData) => {
  const url = `${API_BASE_URL}/public-forms/equipment-borrows`;
  console.log('🚀 Submitting to URL:', url);
  console.log('📤 Submitting data:', data);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  console.log('📥 Response status:', response.status);
  console.log('📥 Response ok:', response.ok);

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ API Error:', error);
    throw new Error(error.message || 'Failed to submit equipment borrow request');
  }

  const result = await response.json();
  console.log('✅ Success result:', result);
  return result;
};

// Public Software Installation API
export const submitPublicSoftwareInstallation = async (data: PublicSoftwareInstallationData) => {
  const response = await fetch(`${API_BASE_URL}/public-forms/software-installations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit software installation request');
  }

  return response.json();
};
