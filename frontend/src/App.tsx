import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import InventoryPage from "./pages/InventoryPage";
import LaboratoriesPage from "./pages/LaboratoriesPage";
import DailyReportsPage from "./pages/DailyReportsPage";
import ProfilePage from "./pages/ProfilePage";
import AssignmentsPage from "./pages/AssignmentsPage";
import UserManagementPage from "./pages/UserManagementPage";
import MainLayout from "./components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Package, Building, FileText, Users } from "lucide-react";

// Simple Home Page Component
const HomePage = () => (
  <div className="space-y-6">
    {/* Header */}
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Welcome to CIT Asset Management</h1>
      <p className="text-gray-600">Manage your laboratory assets and daily reports efficiently</p>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900">150</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Laboratories</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Building className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Daily Reports</p>
              <p className="text-2xl font-bold text-gray-900">42</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Quick Actions */}
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="font-medium">Manage Assets</p>
          </div>
          <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <Building className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="font-medium">View Labs</p>
          </div>
          <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <FileText className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <p className="font-medium">Reports</p>
          </div>
          <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <Users className="w-8 h-8 mx-auto mb-2 text-orange-600" />
            <p className="font-medium">Users</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

function App() {
  const { user } = useAuth(); // Check if user is logged in
  const [currentPage, setCurrentPage] = useState<"home" | "inventory" | "labs" | "reports" | "assignments" | "user-management" | "profile">(
    "home",
  );

  const handleNavigate = (page: string) => {
    setCurrentPage(page as any);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage />;
      case "inventory":
        return <InventoryPage />;
      case "labs":
        return <LaboratoriesPage />;
      case "reports":
        return <DailyReportsPage />;
      case "assignments":
        return <AssignmentsPage />;
      case "user-management":
        return <UserManagementPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  // 1. IF NOT LOGGED IN -> SHOW LOGIN PAGE
  if (!user) {
    return <LoginPage />;
  }

  // 2. IF LOGGED IN -> SHOW MAIN APP WITH SIDEBAR
  return (
    <MainLayout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </MainLayout>
  );
}

export default App;
