import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { PublicLabRequestForm } from '../components/forms/PublicLabRequestForm';
import { PublicEquipmentBorrowForm } from '../components/forms/PublicEquipmentBorrowForm';
import { PublicSoftwareInstallForm } from '../components/forms/PublicSoftwareInstallForm';

const OneTimeFormPage = () => {
  const [activeTab, setActiveTab] = useState('lab-request');
  const [token, setToken] = useState<string>('');
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedForm, setSubmittedForm] = useState<any>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [custodianName, setCustodianName] = useState<string>('');
  const [assignedLab, setAssignedLab] = useState<string>('');

  // Smart API URL detection
  const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    console.log('Current hostname:', hostname);
    
    // Always use network IP for API calls when accessing from network
    const getApiBaseUrl = () => {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3001';
      }
      // Use dynamic hostname for network access
      return `http://${hostname}:3001`;
    };
    // Fallback to current origin with port 3001
    return `${window.location.protocol}//${hostname}:3001`;
  };

  const apiBaseUrl = getApiBaseUrl();

  // Get token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    console.log('URL params:', urlParams.toString());
    console.log('Extracted token:', urlToken);
    
    if (urlToken) {
      setToken(urlToken);
      console.log('About to validate token...');
      validateToken(urlToken);
    } else {
      console.log('No token found in URL');
      setIsTokenValid(false);
    }
  }, []);

  const validateToken = async (tokenToValidate: string) => {
    try {
      console.log('Validating token:', tokenToValidate);
      console.log('API URL:', `${apiBaseUrl}/api/one-time-forms/validate/${tokenToValidate}`);
      
      const response = await fetch(`${apiBaseUrl}/api/one-time-forms/validate/${tokenToValidate}`);
      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('Validation result:', result);
      
      if (result.success) {
        setIsTokenValid(true);
        setExpiresAt(new Date(result.expiresAt));
        // Store custodian name from generatedBy field
        if (result.generatedBy) {
          setCustodianName(result.generatedBy);
        }
        // Store assigned lab from assignedLab field
        if (result.assignedLab) {
          setAssignedLab(result.assignedLab);
        }
        console.log('Token validated successfully');
      } else {
        setIsTokenValid(false);
        console.log('Token validation failed:', result.message);
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setIsTokenValid(false);
    }
  };

  const handleFormSubmit = async (formData: any, formType: string) => {
    console.log('🚀 Form submit attempted');
    console.log('🔑 Token being used:', token);
    console.log('✅ Token valid?', isTokenValid);
    
    if (!token || !isTokenValid) {
      alert('Invalid or expired token');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/one-time-forms/submit/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType,
          formData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSubmittedForm({
          type: formType,
          data: formData,
          result: result.data,
          submittedAt: new Date().toISOString()
        });
      } else {
        console.error('❌ Form submission failed:', result);
        console.error('❌ Error message:', result.message);
        console.error('❌ Full result object:', JSON.stringify(result, null, 2));
        alert('Failed to submit form: ' + result.message);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormTypeLabel = (type: string) => {
    switch (type) {
      case 'lab-request':
        return 'Lab Request';
      case 'equipment-borrow':
        return 'Equipment Borrow';
      case 'software-install':
        return 'Software Installation';
      default:
        return type;
    }
  };

  if (isTokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-4 px-4 sm:py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <h2 className="text-lg font-semibold text-gray-900">Validating your access token...</h2>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isTokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-4 px-4 sm:py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">
                This one-time link is invalid or has expired.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (submittedForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 px-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Submitted Successfully!</h2>
              <p className="text-gray-600 mb-4">
                Your {getFormTypeLabel(submittedForm.type)} has been submitted and is now pending review.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
                <h3 className="font-semibold mb-2">Submission Details:</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Type:</strong> {getFormTypeLabel(submittedForm.type)}</p>
                  <p><strong>Name:</strong> {submittedForm.data.faculty_student_name || submittedForm.data.faculty_name || 'N/A'}</p>
                  <p><strong>Laboratory:</strong> {submittedForm.data.laboratory || 'N/A'}</p>
                  {custodianName && (
                    <p><strong>Custodian:</strong> {custodianName}</p>
                  )}
                  {submittedForm.type === 'equipment-borrow' && submittedForm.data.equipment_list && (
                    <p>
                      <strong>Equipment List:</strong>{' '}
                      {Array.isArray(submittedForm.data.equipment_list)
                        ? submittedForm.data.equipment_list
                            .map((item: any) => `${item.unitQty || ''} ${item.equipmentName || ''}`.trim())
                            .filter(Boolean)
                            .join(', ')
                        : typeof submittedForm.data.equipment_list === 'string'
                        ? submittedForm.data.equipment_list
                        : 'N/A'}
                    </p>
                  )}
                  {submittedForm.type === 'software-install' && submittedForm.data.software_list && (
                    <p><strong>Software List:</strong> {submittedForm.data.software_list}</p>
                  )}
                  <p><strong>Purpose:</strong> {submittedForm.data.purpose || submittedForm.data.software_list || 'N/A'}</p>
                  <p><strong>Submitted:</strong> {new Date(submittedForm.submittedAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">One-Time Form Access</h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Submit your request using this secure one-time link
                {expiresAt && (
                  <span className="block text-sm text-orange-600 mt-2">
                    ⏰ Link expires: {expiresAt.toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Form selection tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex flex-wrap sm:flex sm:space-x-8 gap-2 sm:gap-0">
            <button 
              className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'lab-request' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('lab-request')}
            >
              <FileText className="w-4 h-4" />
              Lab Request
            </button>
            <button 
              className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'equipment-borrow' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('equipment-borrow')}
            >
              <FileText className="w-4 h-4" />
              Equipment Borrow
            </button>
            <button 
              className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'software-install' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('software-install')}
            >
              <FileText className="w-4 h-4" />
              Software Install
            </button>
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'lab-request' && isTokenValid && custodianName && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <PublicLabRequestForm 
                  key={custodianName} // Force re-render when custodianName changes
                  onSubmit={(data) => handleFormSubmit(data, 'lab-request')}
                  disabled={isSubmitting}
                  custodianName={custodianName}
                  assignedLab={assignedLab}
                  isOneTimeForm={true}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'lab-request' && (!isTokenValid || !custodianName) && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p>Loading form...</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'equipment-borrow' && isTokenValid && custodianName && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <PublicEquipmentBorrowForm 
                  key={custodianName} // Force re-render when custodianName changes
                  onSubmit={(data) => handleFormSubmit(data, 'equipment-borrow')}
                  disabled={isSubmitting}
                  custodianName={custodianName}
                  assignedLab={assignedLab}
                  isOneTimeForm={true}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'equipment-borrow' && (!isTokenValid || !custodianName) && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p>Loading form...</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'software-install' && isTokenValid && custodianName && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <PublicSoftwareInstallForm 
                  key={custodianName} // Force re-render when custodianName changes
                  onSubmit={(data) => handleFormSubmit(data, 'software-install')}
                  disabled={isSubmitting}
                  custodianName={custodianName}
                  assignedLab={assignedLab}
                  isOneTimeForm={true}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'software-install' && (!isTokenValid || !custodianName) && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p>Loading form...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default OneTimeFormPage;
