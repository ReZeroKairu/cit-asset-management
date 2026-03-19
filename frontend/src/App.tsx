import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import InventoryPage from "./pages/InventoryPage";
import LaboratoriesPage from "./pages/LaboratoriesPage";
import DailyReportsPage from "./pages/DailyReportsPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import { ArchivesPage } from "./pages/ArchivesPage";
import ProfilePage from "./pages/ProfilePage";
import UserManagementPage from "./pages/UserManagementPage";
import FormsPage from "./pages/FormsPage";
import PublicFormsPage from "./pages/PublicFormsPage";
import PublicLandingPage from "./pages/PublicLandingPage";
import OneTimeFormPage from "./pages/OneTimeFormPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import ComplaintsManagementPage from "./pages/ComplaintsManagementPage";
import CITLabUsersPage from "./pages/CITLabUsersPage";
import MainLayout from "./components/layout/MainLayout";
import { Card, CardContent } from "./components/ui/card";
import MaintenancePage from "./pages/MaintenancePage";
import InventoryAnalyticsSection from "./components/admin/InventoryAnalyticsSection";
import CustodianInventoryAnalyticsSection from "./components/admin/CustodianInventoryAnalyticsSection";
import AuditSection from "./components/audit/AuditSection";
// ✅ UPDATED: Added Wrench icon
import {
  Package,
  Building,
  FileText,
  Wrench,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import { getDashboardStats, type DashboardData } from "./api/dashboard";

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
    null
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
            : userRole === "Admin"
            ? "Manage reports efficiently"
            : "Manage your laboratory assets and daily reports efficiently"}
        </p>
      </div>

      {/* Stats Cards */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${
          !isAdmin ? "lg:grid-cols-3" : ""
        }`}
      >
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

        {/* ✅ NEW: Maintenance Card - Only for Custodians */}
        {userRole === "Custodian" && (
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => handleNavigate("maintenance")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Maintenance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.unservicedWorkstations || 0}
                  </p>
                  <p className="text-xs text-indigo-600 mt-1">
                    {stats.servicedWorkstations || 0} serviced • {stats.unservicedWorkstations || 0} need attention →
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => handleNavigate("forms")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {isAdmin ? "Forms for Approval" : "Active Forms"}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalForms}
                </p>
                <p className="text-xs text-indigo-600 mt-1">
                  Click to view forms →
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
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
        )}

        {/* ✅ NEW: Complaints Dashboard Card - Only for Custodians */}
        {userRole === "Custodian" && (
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => handleNavigate("complaints-management")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Complaints
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalComplaints || 0}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    {stats.openComplaints || 0} Open •{" "}
                    {stats.inProgressComplaints || 0} In Progress
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Inventory Analytics Section - Role Based */}
      {userRole === "Admin" ? (
        <InventoryAnalyticsSection />
      ) : userRole === "Custodian" ? (
        <CustodianInventoryAnalyticsSection />
      ) : null}

      {/* Audit Section - Admin Only */}
      {isAdmin && (
        <AuditSection />
      )}
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
    | "archives"
    | "user-management"
    | "profile"
    | "forms"
    | "public-forms"
    | "public-landing"
    | "one-time-form"
    | "complaints"
    | "complaints-management"
    | "login"
    | "maintenance"
    | "public-complaints"
    | "cit-lab-users"
  >(() => {
    const path = window.location.pathname;
    if (path === "/login") return "login";
    if (path === "/public-forms") return "public-forms";
    if (path === "/complaints") return "complaints";
    if (path === "/public-complaints") return "public-complaints";
    if (path === "/cit-lab-users") return "cit-lab-users";
    if (path === "/one-time" || path.startsWith("/one-time"))
      return "one-time-form";

    const storedUser = localStorage.getItem("user");
    const isLoggedIn = storedUser && storedUser !== "null";

    if (path === "/") {
      return isLoggedIn ? "home" : "public-landing";
    }

    return isLoggedIn ? "home" : "public-landing";
  });

  useEffect(() => {
    const path = window.location.pathname;
    if (user && path === "/" && currentPage === "public-landing") {
      setCurrentPage("home");
    }
  }, [user, currentPage]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/public-forms") {
        setCurrentPage("public-forms");
      } else if (path === "/complaints") {
        setCurrentPage("complaints");
      } else if (path === "/public-complaints") {
        setCurrentPage("public-complaints");
      } else if (path === "/cit-lab-users") {
        setCurrentPage("cit-lab-users");
      } else if (path === "/one-time" || path.startsWith("/one-time")) {
        setCurrentPage("one-time-form");
      } else if (path === "/public-landing") {
        setCurrentPage("public-landing");
      } else if (!user) {
        setCurrentPage("public-landing");
      } else {
        setCurrentPage("home");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [user]);

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
    if (page === "public-forms") {
      window.history.pushState(null, "", "/public-forms");
    } else if (page === "complaints") {
      window.history.pushState(null, "", "/complaints");
    } else if (page === "public-complaints") {
      window.history.pushState(null, "", "/public-complaints");
    } else if (page === "cit-lab-users") {
      window.history.pushState(null, "", "/cit-lab-users");
    } else if (page === "login") {
      window.history.pushState(null, "", "/login");
    } else if (page === "one-time-form") {
      window.history.pushState(null, "", "/one-time");
    } else {
      window.history.pushState(null, "", "/");
    }
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
      case "archives":
        return <ArchivesPage />;
      case "user-management":
        return (
          <UserManagementPage
            createUserData={createUserData}
            setCreateUserData={setCreateUserData}
          />
        );
      case "profile":
        return <ProfilePage />;
      case "maintenance":
        return <MaintenancePage />;
      case "forms":
        return <FormsPage />;
      case "one-time-form":
        return <OneTimeFormPage />;
      case "public-forms":
        return <PublicFormsPage />;
      case "public-complaints":
        return <ComplaintsPage />;
      case "cit-lab-users":
        return <CITLabUsersPage />;
      case "complaints":
        return <ComplaintsPage />;
      case "complaints-management":
        // Only custodians can access complaints management
        if (user?.role !== "Custodian") {
          return <HomePage onNavigate={handleNavigate} />;
        }
        return <ComplaintsManagementPage />;
      case "public-landing":
        return <PublicLandingPage />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  // 1. PUBLIC PAGES - Never show sidebar, regardless of login status
  if (
    currentPage === "one-time-form" ||
    currentPage === "public-forms" ||
    currentPage === "public-complaints" ||
    currentPage === "cit-lab-users" ||
    currentPage === "public-landing"
  ) {
    return renderPage();
  }

  // 2. IF NOT LOGGED IN -> SHOW LOGIN PAGE
  if (!user) {
    return <LoginPage />;
  }

  // 3. IF LOGGED IN -> SHOW MAIN APP WITH SIDEBAR
  return (
    <MainLayout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </MainLayout>
  );
}

export default App;
