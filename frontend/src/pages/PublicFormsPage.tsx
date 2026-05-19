import { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { PublicSoftwareInstallForm } from "../components/forms/PublicSoftwareInstallForm";
import {
  submitPublicSoftwareInstallation,
} from "../api/publicForms";

// Interface for submitted form data
interface SubmittedForm {
  type: string;
  data: {
    faculty_student_name?: string;
    faculty_name?: string;
    user_type?: string;
    usage_type?: string;
    purpose?: string;
    software_list?: string;
    laboratory?: string;
    date?: string;
    requested_by?: string;
    installation_remarks?: string;
    prepared_by?: string;
    approved_by?: string;
  };
  result?: {
    message?: string;
    success?: boolean;
  };
  submittedAt: string;
}

// Interface for form submission error
interface FormError {
  message?: string;
}

const PublicFormsPage = () => {
  const [submittedForm, setSubmittedForm] = useState<SubmittedForm | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (formData: any, formType: string) => {
    setIsSubmitting(true);
    try {
      let result;
      switch (formType) {
        case "software-install":
          result = await submitPublicSoftwareInstallation(formData);
          break;
      }

      setSubmittedForm({
        type: formType,
        data: formData,
        result: result,
        submittedAt: new Date().toISOString(),
      });

      // Success is handled by the submittedForm state
    } catch (error: unknown) {

      // Check if it's a rate limit error by checking the error message directly
      const formError = error as FormError;
      const errorMessage = formError.message || "";
      if (errorMessage.includes("Too many form submissions")) {
        alert("Maximum submission reached. Please try again in an hour.");
      } else {
        alert("Error submitting form. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormTypeLabel = (type: string) => {
    switch (type) {
      case "software-install":
        return "Software Installation Request";
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
              onClick={() => (window.location.href = "/public-landing")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              CIT Asset Management Forms
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Submit your requests for software installation
            </p>
          </div>
        </div>

        
        {/* Success message */}
        {submittedForm && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Form Submitted Successfully!
                </h2>
                <p className="text-gray-600 mb-4">
                  Your{" "}
                  {getFormTypeLabel(submittedForm.type)} has
                  been submitted and is now pending review.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
                  <h3 className="font-semibold mb-2">Submission Details:</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <strong>Type:</strong>{" "}
                      {getFormTypeLabel(submittedForm.type)}
                    </p>
                    <p>
                      <strong>Name:</strong>{" "}
                      {submittedForm.data.faculty_student_name ||
                        submittedForm.data.faculty_name ||
                        "N/A"}
                    </p>
                    <p>
                      <strong>User Type:</strong>{" "}
                      {submittedForm.data.user_type || "N/A"}
                    </p>
                    <p>
                      <strong>Laboratory:</strong>{" "}
                      {submittedForm.data.laboratory || "N/A"}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {submittedForm.data.date ? new Date(submittedForm.data.date).toLocaleDateString() : "N/A"}
                    </p>
                    <p>
                      <strong>Software List:</strong>{" "}
                      {submittedForm.data.software_list || "N/A"}
                    </p>
                    <p>
                      <strong>Requested By:</strong>{" "}
                      {submittedForm.data.requested_by || "N/A"}
                    </p>
                    {submittedForm.data.installation_remarks && (
                      <p>
                        <strong>Installation Remarks:</strong>{" "}
                        {submittedForm.data.installation_remarks}
                      </p>
                    )}
                    {submittedForm.data.approved_by && (
                      <p>
                        <strong>Approved By:</strong>{" "}
                        {submittedForm.data.approved_by}
                      </p>
                    )}
                    <p>
                      <strong>Submitted:</strong>{" "}
                      {new Date(submittedForm.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Button
                    onClick={() => setSubmittedForm(null)}
                    className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    Submit Another Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Software Installation Form */}
        {!submittedForm && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <PublicSoftwareInstallForm
                  onSubmit={(data) =>
                    handleFormSubmit(data, "software-install")
                  }
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
