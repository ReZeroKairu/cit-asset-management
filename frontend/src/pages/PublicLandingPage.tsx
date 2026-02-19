import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { FileText, ArrowRight, MessageSquare } from "lucide-react";

const PublicLandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            CIT Asset Management
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            <strong>College of Information Technology Laboratory & Equipment Management System</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <FileText className="w-8 h-8 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold">Submit Forms</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Submit requests for laboratory usage, equipment borrowing, and software installation without login.
              </p>
              <Button 
                onClick={() => window.location.href = '/public-forms'}
                className="w-full"
              >
                Access Public Forms
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <MessageSquare className="w-8 h-8 text-orange-600 mr-3" />
                <h2 className="text-xl font-semibold">Complaint Ticket</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Submit complaints about issues in your workstation.
              </p>
              <Button 
                onClick={() => alert('Complaint system coming soon!')}
                variant="outline"
                className="w-full"
                disabled
              >
                Submit Complaint
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <FileText className="w-8 h-8 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold">Staff Portal</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Login to access the full management system for staff and administrators.
              </p>
              <Button 
                onClick={() => window.location.href = '/login'}
                variant="outline"
                className="w-full"
              >
                Staff Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>College of Information Technology</p>
          <p>&copy; 2026 CIT Asset Management System</p>
        </div>
      </div>
    </div>
  );
};

export default PublicLandingPage;
