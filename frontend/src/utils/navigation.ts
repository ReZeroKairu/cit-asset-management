import type { PageType } from "../hooks/useAppRouting";

export const PUBLIC_PAGES: PageType[] = [
  "one-time-form",
  "public-forms", 
  "public-complaints",
  "cit-lab-users",
  "public-landing"
];

export const isPublicPage = (page: PageType): boolean => {
  return PUBLIC_PAGES.includes(page);
};

export const getNavigationTitle = (page: PageType): string => {
  const titles: Record<PageType, string> = {
    home: "Home",
    inventory: "Inventory",
    labs: "Laboratories", 
    reports: "Daily Reports",
    "admin-reports": "Admin Reports",
    archives: "Archives",
    "user-management": "User Management",
    profile: "Profile",
    forms: "Forms",
    "public-forms": "Public Forms",
    "public-landing": "Welcome",
    "one-time-form": "Form",
    complaints: "Complaints",
    "complaints-management": "Complaints Management",
    login: "Login",
    maintenance: "Maintenance",
    "public-complaints": "Submit Complaint",
    "cit-lab-users": "CIT Lab Users"
  };

  return titles[page] || "Unknown Page";
};
