import api from "./axios";
import type { PublicSoftwareInstallationData } from './publicForms';

// Lab Request API
export const submitLabRequest = async (formData: any) => {
  const response = await api.post('/forms/lab-requests', formData);
  return response.data;
};

// Get lab requests (with optional date filtering)
export const getLabRequests = async (dateFilter?: { start_date?: string; end_date?: string }) => {
  const queryParams = new URLSearchParams();
  if (dateFilter?.start_date) queryParams.append("start_date", dateFilter.start_date);
  if (dateFilter?.end_date) queryParams.append("end_date", dateFilter.end_date);

  const response = await api.get(`/forms/lab-requests?${queryParams}`);
  return response.data;
};

export const updateLabRequestStatus = async (id: number, status: string) => {
  const response = await api.put(`/forms/lab-requests/${id}/status`, { status });
  return response.data;
};

// Update lab request details (for custodian editing)
export const updateLabRequestDetails = async (id: number, details: any) => {
  const response = await api.put(`/forms/lab-requests/${id}`, details);
  return response.data;
};

// Equipment Borrow API
export const submitEquipmentBorrow = async (formData: any) => {
  const response = await api.post('/forms/equipment-borrows', formData);
  return response.data;
};

// Get equipment borrows (with optional date filtering)
export const getEquipmentBorrows = async (dateFilter?: { start_date?: string; end_date?: string }) => {
  const queryParams = new URLSearchParams();
  if (dateFilter?.start_date) queryParams.append("start_date", dateFilter.start_date);
  if (dateFilter?.end_date) queryParams.append("end_date", dateFilter.end_date);

  const response = await api.get(`/forms/equipment-borrows?${queryParams}`);
  return response.data;
};

export const updateEquipmentBorrowStatus = async (id: number, status: string) => {
  const response = await api.put(`/forms/equipment-borrows/${id}/status`, { status });
  return response.data;
};

// Update equipment borrow details (for custodian editing)
export const updateEquipmentBorrowDetails = async (id: number, details: any) => {
  const response = await api.put(`/forms/equipment-borrows/${id}`, details);
  return response.data;
};

// Software Installation API
export const submitSoftwareInstallation = async (formData: any) => {
  const response = await api.post('/forms/software-installations', formData);
  return response.data;
};

// Fetch one-time form submissions without authentication
export const getOneTimeFormSubmissionsNoAuth = async () => {
  try {
    // Use the authenticated API since this is called from FormsPage where user is logged in
    const [labRequests, equipmentBorrows, softwareInstallations] = await Promise.all([
      api.get('/forms/lab-requests'),
      api.get('/forms/equipment-borrows'),
      api.get('/forms/software-installations')
    ]);
    
    // Handle API response structure properly
    const labRequestsData = labRequests?.data || [];
    const equipmentBorrowsData = equipmentBorrows?.data || [];
    const softwareInstallationsData = softwareInstallations?.data || [];
    
    console.log('🔍 One-time forms data:', {
      labRequestsData,
      equipmentBorrowsData,
      softwareInstallationsData
    });
    
    // Ensure we have arrays before mapping
    const labRequestsArray = Array.isArray(labRequestsData) ? labRequestsData : [];
    const equipmentBorrowsArray = Array.isArray(equipmentBorrowsData) ? equipmentBorrowsData : [];
    const softwareInstallationsArray = Array.isArray(softwareInstallationsData) ? softwareInstallationsData : [];
    
    // Combine all forms and mark those submitted via one-time tokens
    const allSubmissions = [
      ...(labRequestsArray.map((req: any) => ({
        ...req,
        formType: 'lab-request',
        formId: req.request_id,
        request_id: req.request_id,
        submittedVia: req.usage_type === 'One-Time QR Code' ? 'one-time-token' : 'regular'
      }))),
      ...(equipmentBorrowsArray.map((borrow: any) => ({
        ...borrow,
        formType: 'equipment-borrow',
        formId: borrow.borrow_id,
        borrow_id: borrow.borrow_id,
        submittedVia: borrow.usage_type === 'One-Time QR Code' ? 'one-time-token' : 'regular'
      }))),
      ...(softwareInstallationsArray.map((install: any) => ({
        ...install,
        formType: 'software-install',
        formId: install.id,
        submittedVia: install.usage_type === 'One-Time QR Code' ? 'one-time-token' : 'regular'
      })))
    ];
    
    // Filter only one-time submissions
    const oneTimeSubmissions = allSubmissions.filter(form => form.submittedVia === 'one-time-token');
    
    console.log('🔍 Filtered one-time submissions:', oneTimeSubmissions);
    
    return oneTimeSubmissions;
  } catch (error) {
    console.error('Error fetching one-time form submissions:', error);
    throw new Error((error as Error).message || 'Failed to fetch one-time form submissions');
  }
};

export const getOneTimeFormSubmissions = async () => {
  try {
    // One-time form submissions are stored in the same database tables as regular forms
    // We need to fetch all forms and filter for those submitted via one-time tokens
    const [labRequests, equipmentBorrows, softwareInstallations] = await Promise.all([
      api.get('/forms/lab-requests'),
      api.get('/forms/equipment-borrows'),
      api.get('/forms/software-installations')
    ]);
    
    // Handle API response structure properly
    console.log('Raw labRequests response:', labRequests);
    console.log('labRequests type:', typeof labRequests);
    console.log('labRequests isArray:', Array.isArray(labRequests));
    
    const labRequestsData = Array.isArray(labRequests) ? labRequests : labRequests?.data || [];
    const equipmentBorrowsData = Array.isArray(equipmentBorrows) ? equipmentBorrows : equipmentBorrows?.data || [];
    const softwareInstallationsData = Array.isArray(softwareInstallations) ? softwareInstallations : softwareInstallations?.data || [];
    
    // Combine all forms and mark those submitted via one-time tokens
    const allSubmissions = [
      ...labRequestsData.map((req: any) => ({
        ...req,
        formType: 'lab-request',
        formId: req.request_id,
        request_id: req.request_id,
        submittedVia: req.usage_type === 'One-Time QR Code' ? 'one-time-token' : 'regular'
      })),
      ...equipmentBorrowsData.map((borrow: any) => ({
        ...borrow,
        formType: 'equipment-borrow',
        formId: borrow.borrow_id,
        borrow_id: borrow.borrow_id,
        submittedVia: 'one-time-token' // All equipment borrows from one-time forms will have this
      })),
      ...softwareInstallationsData.map((install: any) => ({
        ...install,
        formType: 'software-install',
        formId: install.id,
        installation_id: install.id,
        submittedVia: 'one-time-token' // All software installs from one-time forms will have this
      }))
    ];
    
    // Filter only submissions from one-time tokens
    const oneTimeSubmissions = allSubmissions.filter(submission =>
      submission.submittedVia === 'one-time-token' || 
      submission.usage_type === 'One-Time QR Code'
    );
    
    return oneTimeSubmissions;
  } catch (error) {
    console.error('Error fetching one-time form submissions:', error);
    throw new Error((error as Error).message || 'Failed to fetch one-time form submissions');
  }
};

export const submitPublicSoftwareInstallation = async (data: PublicSoftwareInstallationData) => {
  const response = await api.post('/forms/software-installations', data);
  return response.data;
};

// Get software installations (with optional date filtering)
export const getSoftwareInstallations = async (dateFilter?: { start_date?: string; end_date?: string }) => {
  const queryParams = new URLSearchParams();
  if (dateFilter?.start_date) queryParams.append("start_date", dateFilter.start_date);
  if (dateFilter?.end_date) queryParams.append("end_date", dateFilter.end_date);

  const response = await api.get(`/forms/software-installations?${queryParams}`);
  return response.data;
};

export const updateSoftwareInstallationStatus = async (id: number, status: string) => {
  const response = await api.put(`/forms/software-installations/${id}/status`, { status });
  return response.data;
};

// Update software installation details (for custodian editing)
export const updateSoftwareInstallDetails = async (id: number, details: any) => {
  const response = await api.put(`/forms/software-installations/${id}`, details);
  return response.data;
};
