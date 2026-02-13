import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import InventoryPage from "./pages/InventoryPage";
import LaboratoriesPage from "./pages/LaboratoriesPage";
import DailyReportsPage from "./pages/DailyReportsPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import ArchivedReportsPage from "./pages/ArchivedReportsPage";
import ProfilePage from "./pages/ProfilePage";
import UserManagementPage from "./pages/UserManagementPage";
import MainLayout from "./components/layout/MainLayout";
import { Card, CardContent } from "./components/ui/card";
// ✅ UPDATED: Added Wrench icon
import { Package, Building, FileText, Users, Wrench } from "lucide-react";
import { getDashboardStats, type DashboardData } from "./api/dashboard";
import MaintenancePage from "./pages/MaintenancePage";

interface CreateUserData {
  full_name: string;
  email: string;
  password: string;
  role: string;
  lab_id: string;
  selectedCampus: string;
  selectedOfficeType: string;
  selectedDept: string;
}

interface LabFormData {
  lab_name: string;
  location?: string | null;
  dept_id?: number | null;
}

// Home Page Component with Real Data
const HomePage = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getDashboardStats();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleNavigate = (page: string) => {
    if (page === "user-management" && user?.role !== "Admin") {
      console.log("Access denied: Admin only");
      return;
    }
    onNavigate(page);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const { stats, userAssignedLab, userRole } = dashboardData;
  const isAdmin = userRole === "Admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome to CIT Asset Management
        </h1>
        <p className="text-gray-600">
          {userRole === "Custodian" && userAssignedLab
            ? `Manage your laboratory assets and daily reports efficiently for ${userAssignedLab.lab_name}`
            : "Manage your laboratory assets and daily reports efficiently"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`}>
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => handleNavigate("inventory")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Assets
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalAssets}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Click to view assets →
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ✅ NEW: Maintenance Card */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => handleNavigate("maintenance")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-gray-900">QPMC</p>
                <p className="text-xs text-indigo-600 mt-1">
                  Preventive Checks →
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <Wrench className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => handleNavigate(isAdmin ? "admin-reports" : "reports")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Daily Reports
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalDailyReports}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Click to view reports →
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {isAdmin ? (
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => handleNavigate("labs")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Laboratories
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalLaboratories}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Click to view labs →
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Building className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Placeholder or another user card for Custodians if needed */
          <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 bg-gray-50">
            <CardContent className="pt-6 flex items-center justify-center h-full">
              <p className="text-gray-400 text-sm">System Status: Active</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

function App() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<
    | "home"
    | "inventory"
    | "labs"
    | "reports"
    | "admin-reports"
    | "archived-reports"
    | "user-management"
    | "profile"
    | "maintenance"
  >("home");

  const [createUserData, setCreateUserData] = useState<CreateUserData>({
    full_name: "",
    email: "",
    password: "",
    role: "Custodian",
    lab_id: "",
    selectedCampus: "",
    selectedOfficeType: "",
    selectedDept: "",
  });

  const [labFormData, setLabFormData] = useState<LabFormData>({
    lab_name: "",
    location: "",
    dept_id: null,
  });

  const handleNavigate = (page: string) => {
    setCurrentPage(page as any);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage onNavigate={handleNavigate} />;
      case "inventory":
        return <InventoryPage />;
      case "labs":
        return (
          <LaboratoriesPage
            labFormData={labFormData}
            setLabFormData={setLabFormData}
          />
        );
      case "reports":
        return <DailyReportsPage />;
      case "admin-reports":
        return <AdminReportsPage />;
      case "archived-reports":
        return <ArchivedReportsPage />;
      case "maintenance":
        return <MaintenancePage />;
      case "user-management":
        return (
          <UserManagementPage
            createUserData={createUserData}
            setCreateUserData={setCreateUserData}
          />
        );
      case "profile":
        return <ProfilePage />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  if (!user) {
    return <LoginPage />;
  }

  return (
    <MainLayout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </MainLayout>
  );
}

export default App;
