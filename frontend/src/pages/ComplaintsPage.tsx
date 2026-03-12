import { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import ComplaintForm from "../components/forms/ComplaintForm";
import { submitComplaint, type ComplaintData } from "../api/complaints";
import { CheckCircle, MessageSquare, ArrowLeft } from "lucide-react";

const ComplaintsPage = () => {
  const [submittedComplaint, setSubmittedComplaint] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplaintSubmit = async (complaintData: ComplaintData) => {
    setIsSubmitting(true);
    try {
      const result = await submitComplaint(complaintData);
      setSubmittedComplaint({
        data: complaintData,
        result: result,
        submittedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error submitting complaint:', error);
      
      // Check if it's a rate limit error
      if (error.message && error.message.includes('Too many form submissions')) {
        alert('Maximum submission reached. Please try again in an hour.');
      } else if (error.error && error.error.includes('Too many form submissions')) {
        alert('Maximum submission reached. Please try again in an hour.');
      } else {
        alert('Error submitting complaint. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedComplaint) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 px-4 sm:py-8 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back button outside card */}
          <div className="flex justify-start mb-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/public-landing'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Submitted Successfully!</h2>
              <p className="text-gray-600 mb-4">
                Your complaint has been submitted and is now being processed.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 text-left max-w-2xl mx-auto">
                <h3 className="font-semibold mb-4 text-lg">Complaint Details:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Status:</strong> 
                      <span className="inline-block ml-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        Open
                      </span>
                    </p>
                  </div>
                  <div>
                    <p><strong>Name:</strong> {submittedComplaint.data.faculty_student_name}</p>
                  </div>
                  <div>
                    <p><strong>User Type:</strong> {submittedComplaint.data.user_type}</p>
                  </div>
                  {submittedComplaint.data.year_level && (
                    <div>
                      <p><strong>Year Level:</strong> {submittedComplaint.data.year_level}</p>
                    </div>
                  )}
                  {submittedComplaint.data.laboratory_name && (
                    <div>
                      <p><strong>Laboratory:</strong> {submittedComplaint.data.laboratory_name}</p>
                    </div>
                  )}
                  {submittedComplaint.data.workstation_name && (
                    <div>
                      <p><strong>Workstation:</strong> {submittedComplaint.data.workstation_name}</p>
                    </div>
                  )}
                  {submittedComplaint.data.selected_asset?.units?.unit_name && (
                    <div>
                      <p><strong>Asset:</strong> {submittedComplaint.data.selected_asset.units.unit_name}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <p><strong>Issue Description:</strong></p>
                    <p className="mt-1 text-gray-700 bg-white p-3 rounded border">
                      {submittedComplaint.data.issue_description}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p><strong>Submitted:</strong> {new Date(submittedComplaint.submittedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3 justify-center">
                <Button 
                  onClick={() => setSubmittedComplaint(null)}
                  className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 font-medium px-6 py-2.5"
                >
                  Submit Another Complaint
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:py-8 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back button outside card */}
        <div className="flex justify-start mb-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/public-landing'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Title and description outside card */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <MessageSquare className="w-8 h-8 text-orange-600" />
            Submit Complaint
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Report issues with laboratory equipment, software, or facilities
          </p>
        </div>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <ComplaintForm 
              onSubmit={handleComplaintSubmit}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComplaintsPage;
