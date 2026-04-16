// Dynamic API URL detection
export const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  return `http://${hostname}:3001`;
};

const API_BASE_URL = getApiBaseUrl();

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
