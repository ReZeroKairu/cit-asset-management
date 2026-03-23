import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export type PageType = 
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
  | "cit-lab-users";

const getInitialPage = (): PageType => {
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
};

export const useAppRouting = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>(getInitialPage);

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

  const handleNavigate = (page: PageType) => {
    setCurrentPage(page);
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

  return {
    currentPage,
    setCurrentPage,
    handleNavigate,
  };
};
