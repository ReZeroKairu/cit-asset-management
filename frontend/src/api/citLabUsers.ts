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

export interface CITLabUsersData {
  date: string;
  usage_type: string;
  faculty_student_name: string;
  user_type: string;
  year_level?: string;
  laboratory: string;
  ws_number?: string;
  purpose: string;
  monitored_by?: string;
}

// Public CIT Lab Users API
export const submitCITLabUsers = async (data: CITLabUsersData) => {
  // Ignore duplicate submissions of success response
  if (data && typeof data === 'object' && 'success' in data) {
    return data; // Return the success response as-is
  }
  
  const url = `${API_BASE_URL}/public-forms/cit-lab-users`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};
