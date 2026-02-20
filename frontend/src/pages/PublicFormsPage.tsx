import { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FileText, CheckCircle } from "lucide-react";
import { PublicLabRequestForm } from "../components/forms/PublicLabRequestForm";
import { PublicEquipmentBorrowForm } from "../components/forms/PublicEquipmentBorrowForm";
import { PublicSoftwareInstallForm } from "../components/forms/PublicSoftwareInstallForm";
import { 
  submitPublicLabRequest,
  submitPublicEquipmentBorrow,
  submitPublicSoftwareInstallation
} from "../api/publicForms";

const PublicFormsPage = () => {
  const [activeTab, setActiveTab] = useState('lab-request');
  const [submittedForm, setSubmittedForm] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (formData: any, formType: string) => {
    setIsSubmitting(true);
    try {
      let result;
      switch (formType) {
        case 'lab-request':
          result = await submitPublicLabRequest(formData);
          break;
        case 'equipment-borrow':
          result = await submitPublicEquipmentBorrow(formData);
          break;
        case 'software-install':
          result = await submitPublicSoftwareInstallation(formData);
          break;
      }
      
      setSubmittedForm({
        type: formType,
        data: formData,
        result: result,
        submittedAt: new Date().toISOString()
      });
      
      // Show success message
      setActiveTab('success');
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

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:py-8 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">CIT Asset Management Forms</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Submit your requests for laboratory usage, equipment borrowing, and software installation</p>
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
        {activeTab === 'success' && submittedForm && (
          <div className="space-y-6">
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
                    {submittedForm.data.approved_by && (
                      <p><strong>Approved By:</strong> {submittedForm.data.approved_by}</p>
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
                <Button 
                  onClick={() => {
                    setActiveTab('lab-request');
                    setSubmittedForm(null);
                  }}
                  className="mt-6"
                >
                  Submit Another Form
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lab Request Form */}
        {activeTab === 'lab-request' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <PublicLabRequestForm 
                  onSubmit={(data) => handleFormSubmit(data, 'lab-request')}
                  disabled={isSubmitting}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Equipment Borrow Form */}
        {activeTab === 'equipment-borrow' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <PublicEquipmentBorrowForm 
                  onSubmit={(data) => handleFormSubmit(data, 'equipment-borrow')}
                  disabled={isSubmitting}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Software Installation Form */}
        {activeTab === 'software-install' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <PublicSoftwareInstallForm 
                  onSubmit={(data) => handleFormSubmit(data, 'software-install')}
                  disabled={isSubmitting}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicFormsPage;
