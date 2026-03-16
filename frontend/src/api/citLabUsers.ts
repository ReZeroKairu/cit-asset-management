// Dynamic API URL detection
export const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // For local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // For network access, try to detect if backend is on same port or different port
  if (port === '3000') {
    // If frontend is on 3000, backend is likely on 3001
    return `http://${hostname}:3001`;
  } else if (port === '3001') {
    // If frontend is on 3001, backend might be on same port
    return `http://${hostname}:3001`;
  } else {
    // For other ports, try same port first, then 3001
    return `http://${hostname}:3001`;
  }
};

const API_BASE_URL = getApiBaseUrl();
console.log('🌐 API_BASE_URL initialized to:', API_BASE_URL);

export interface CITLabUsersData {
  date: string;
  usage_type: string;
  faculty_student_name: string;
  user_type: string;
  year_level?: string;
  laboratory: string;
  printing_pages?: string;
  ws_number?: string;
  purpose: string;
  monitored_by?: string;
}

// Public CIT Lab Users API
export const submitCITLabUsers = async (data: CITLabUsersData) => {
  console.log('🔍 Submitting CIT Lab Users Data:', data);
  
  // Ignore duplicate submissions of success response
  if (data && typeof data === 'object' && 'success' in data) {
    console.log('⚠️ Ignoring duplicate submission of success response');
    return data; // Return the success response as-is
  }
  
  // Use only network IP to avoid CORS issues
  const url = `${API_BASE_URL}/public-forms/cit-lab-users`;
  
  try {
    console.log('🔍 Trying to submit to:', url);
    
    const response = await fetch(url, {
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
      console.log('❌ Error response:', error);
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ CIT Lab Users submitted successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to submit to', url + ':', error);
    throw error;
  }
};
