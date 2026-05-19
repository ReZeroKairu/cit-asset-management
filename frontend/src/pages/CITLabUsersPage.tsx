import { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { CheckCircle, ArrowLeft, Users } from "lucide-react";
import { CITLabUsersForm } from "../components/forms/CITLabUsersForm";
import { submitCITLabUsers } from "../api/citLabUsers";

const CITLabUsersPage = () => {
  const [submittedForm, setSubmittedForm] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (response: any) => {
    setIsSubmitting(true);
    try {
      const result = await submitCITLabUsers(response);
      
      // Extract form data from response.formData (if available) or use response directly
      const formDataToStore = response.formData || response;
      
      setSubmittedForm({
        type: 'cit-lab-users',
        data: formDataToStore,
        result: result,
        submittedAt: new Date().toISOString()
      });
      
      // Show success message
    } catch (error: any) {
      
      // Check if it's a rate limit error by checking the error message directly
      const errorMessage = error.message || '';
      if (errorMessage.includes('Too many form submissions')) {
        alert('Maximum submission reached. Please try again in an hour.');
      } else {
        alert('Error submitting form. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormTypeLabel = (type: string, formData?: any) => {
    switch (type) {
      case 'cit-lab-users':
        return 'CIT Lab Users Log';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:py-8 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="mb-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/public-landing'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
          <div className="text-center">
            <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">CIT Lab Users</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Log your laboratory usage for CIT lab user tracking and records</p>
          </div>
        </div>

        {/* Success Message */}
        {submittedForm && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Lab Usage Logged Successfully!</h2>
                <p className="text-gray-600 mb-4">
                  Your {getFormTypeLabel(submittedForm.type)} has been recorded.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
                  <h3 className="font-semibold mb-2">Log Details:</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Type:</strong> {getFormTypeLabel(submittedForm.type, submittedForm.data)}</p>
                    <p><strong>Name:</strong> {submittedForm.data.faculty_student_name || 'N/A'}</p>
                    <p><strong>User Type:</strong> {submittedForm.data.user_type || 'N/A'}</p>
                    <p><strong>Laboratory:</strong> {submittedForm.data.laboratory || 'N/A'}</p>
                    <p><strong>Usage Type:</strong> {submittedForm.data.usage_type || 'N/A'}</p>
                    <p><strong>Purpose:</strong> {submittedForm.data.purpose || 'N/A'}</p>
                    {submittedForm.data.ws_number && <p><strong>Workstation:</strong> {submittedForm.data.ws_number}</p>}
                    <p><strong>Logged:</strong> {new Date(submittedForm.submittedAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Button 
                    onClick={() => {
                      setSubmittedForm(null);
                    }}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Submit Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Form */}
        {!submittedForm && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <CITLabUsersForm 
                  onSubmit={handleFormSubmit}
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

export default CITLabUsersPage;
