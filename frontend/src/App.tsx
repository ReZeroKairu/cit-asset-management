import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import MainLayout from "./components/layout/MainLayout";
import PageRenderer from "./components/pages/PageRenderer";
import { useAppRouting } from "./hooks/useAppRouting";
import { isPublicPage } from "./utils/navigation";

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

function App() {
  const { user } = useAuth();
  const { currentPage, handleNavigate } = useAppRouting();

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

  // 1. PUBLIC PAGES - Never show sidebar, regardless of login status
  if (isPublicPage(currentPage)) {
    return <PageRenderer 
      currentPage={currentPage}
      onNavigate={handleNavigate as (page: string) => void}
      createUserData={createUserData}
      setCreateUserData={setCreateUserData}
      labFormData={labFormData}
      setLabFormData={setLabFormData}
    />;
  }

  // 2. IF NOT LOGGED IN -> SHOW LOGIN PAGE
  if (!user) {
    return <LoginPage />;
  }

  // 3. IF LOGGED IN -> SHOW MAIN APP WITH SIDEBAR
  return (
    <MainLayout currentPage={currentPage} onNavigate={handleNavigate as (page: string) => void}>
      <PageRenderer 
        currentPage={currentPage}
        onNavigate={handleNavigate as (page: string) => void}
        createUserData={createUserData}
        setCreateUserData={setCreateUserData}
        labFormData={labFormData}
        setLabFormData={setLabFormData}
      />
    </MainLayout>
  );
}

export default App;
