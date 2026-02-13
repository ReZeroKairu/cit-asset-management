import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { FileText, ArrowRight } from "lucide-react";

const PublicLandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            CIT Asset Management
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            College of Information Technology Laboratory & Equipment Management System
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                <FileText className="w-8 h-8 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold">Staff Portal</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Login to access the full management system for staff and administrators.
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full"
              >
                Staff Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">About This System</h3>
          <p className="text-blue-800 mb-4">
            This system manages laboratory reservations, equipment borrowing, and software installation requests 
            for the College of Information Technology. Students and faculty can submit forms publicly, 
            while staff can review and manage all requests through the secure portal.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-blue-700">
            <div>
              <strong>🔬 Laboratory Usage:</strong>
              <p className="mt-1">Request lab access for printing, set-in, or reservations</p>
            </div>
            <div>
              <strong>💻 Equipment Borrowing:</strong>
              <p className="mt-1">Borrow equipment for academic and research purposes</p>
            </div>
            <div>
              <strong>⚙️ Software Installation:</strong>
              <p className="mt-1">Request software installation on laboratory computers</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>College of Information Technology</p>
          <p>© 2026 CIT Asset Management System</p>
        </div>
      </div>
    </div>
  );
};

export default PublicLandingPage;
