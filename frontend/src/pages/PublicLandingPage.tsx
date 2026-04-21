import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  FileText,
  ArrowRight,
  MessageSquare,
  Users,
  Shield,
} from "lucide-react";

const PublicLandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 pb-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            CIT Asset Management
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-8">
          <Card className="hover:shadow-xl transition-all duration-300 border border-gray-100">
            <CardContent className="p-9">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Submit Forms
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    Submit requests for software installation.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => (window.location.href = "/public-forms")}
                variant="outline"
                className="w-full mt-4 py-3 text-base font-medium hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Submit Form
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border border-gray-100">
            <CardContent className="p-9">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                  <MessageSquare className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Submit Complaint
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    Report issues with laboratory equipment.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => (window.location.href = "/public-complaints")}
                variant="outline"
                className="w-full mt-4 py-3 text-base font-medium hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Submit Complaint
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border border-gray-100">
            <CardContent className="p-9">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    CIT Lab Users
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    For CIT Students & Faculty only. Log your Laboratory and Workstation usage.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => (window.location.href = "/cit-lab-users")}
                variant="outline"
                className="w-full mt-4 py-3 text-base font-medium hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Log Usage
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border border-gray-100">
            <CardContent className="p-9">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Staff Portal
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    Login for custodians and
                    administrators.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => (window.location.href = "/login")}
                variant="outline"
                className="w-full mt-4 py-3 text-base font-medium hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Login
                <ArrowRight className="w-5 h-5 ml-2" />
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
