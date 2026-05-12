import { useAuth } from "../../context/AuthContext";
import HomePage from "./HomePage";
import InventoryPage from "../../pages/InventoryPage";
import LaboratoriesPage from "../../pages/LaboratoriesPage";
import DailyReportsPage from "../../pages/DailyReportsPage";
import AdminReportsPage from "../../pages/AdminReportsPage";
import { ArchivesPage } from "../../pages/ArchivesPage";
import ProfilePage from "../../pages/ProfilePage";
import UserManagementPage from "../../pages/UserManagementPage";
import FormsPage from "../../pages/FormsPage";
import PublicFormsPage from "../../pages/PublicFormsPage";
import PublicLandingPage from "../../pages/PublicLandingPage";
import ComplaintsPage from "../../pages/ComplaintsPage";
import ComplaintsManagementPage from "../../pages/ComplaintsManagementPage";
import CITLabUsersPage from "../../pages/CITLabUsersPage";
import MaintenancePage from "../../pages/MaintenancePage";
import type { PageType } from "../../hooks/useAppRouting";

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

interface PageRendererProps {
  currentPage: PageType;
  onNavigate: (page: string) => void;
  createUserData: CreateUserData;
  setCreateUserData: React.Dispatch<React.SetStateAction<CreateUserData>>;
  labFormData: LabFormData;
  setLabFormData: React.Dispatch<React.SetStateAction<LabFormData>>;
  urlParams: URLSearchParams;
}

const PageRenderer = ({
  currentPage,
  onNavigate,
  createUserData,
  setCreateUserData,
  labFormData,
  setLabFormData,
  urlParams,
}: PageRendererProps) => {
  const { user } = useAuth();

  switch (currentPage) {
    case "home":
      return <HomePage onNavigate={onNavigate} />;
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
      return <ArchivesPage initialTab={urlParams.get("tab") || undefined} />;
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
      // Only non-admin users can access forms page
      if (user?.role === "Admin") {
        return <HomePage onNavigate={onNavigate} />;
      }
      return <FormsPage />;
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
        return <HomePage onNavigate={onNavigate} />;
      }
      return <ComplaintsManagementPage />;
    case "public-landing":
      return <PublicLandingPage />;
    default:
      return <HomePage onNavigate={onNavigate} />;
  }
};

export default PageRenderer;
