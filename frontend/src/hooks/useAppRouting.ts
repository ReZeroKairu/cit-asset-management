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
  | "complaints"
  | "complaints-management"
  | "login"
  | "maintenance"
  | "public-complaints"
  | "cit-lab-users"
  | "disposals"
  | "developer";

const getInitialPage = (): PageType => {
  const path = window.location.pathname;
  if (path === "/login") return "login";
  if (path === "/public-forms") return "public-forms";
  if (path === "/complaints") return "complaints";
  if (path === "/public-complaints") return "public-complaints";
  if (path === "/cit-lab-users") return "cit-lab-users";
  if (path === "/disposals") return "disposals";

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
  const [urlParams, setUrlParams] = useState<URLSearchParams>(
    new URLSearchParams(window.location.search),
  );

  useEffect(() => {
    const path = window.location.pathname;
    if (user && path === "/" && currentPage === "public-landing") {
      setCurrentPage("home");
    }
  }, [user, currentPage]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      setUrlParams(new URLSearchParams(search));

      if (path === "/public-forms") {
        setCurrentPage("public-forms");
      } else if (path === "/complaints") {
        setCurrentPage("complaints");
      } else if (path === "/public-complaints") {
        setCurrentPage("public-complaints");
      } else if (path === "/cit-lab-users") {
        setCurrentPage("cit-lab-users");
      } else if (path === "/disposals") {
        setCurrentPage("disposals");
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

  const handleNavigate = (pageWithParams: string) => {
    // Parse page and parameters
    const [page, queryString] = pageWithParams.split("?");
    const params = queryString
      ? new URLSearchParams(queryString)
      : new URLSearchParams();

    // Set current page
    setCurrentPage(page as PageType);

    // Update URL with parameters
    if (page === "public-forms") {
      window.history.pushState(null, "", "/public-forms");
    } else if (page === "complaints") {
      window.history.pushState(null, "", "/complaints");
    } else if (page === "public-complaints") {
      window.history.pushState(null, "", "/public-complaints");
    } else if (page === "cit-lab-users") {
      window.history.pushState(null, "", "/cit-lab-users");
    } else if (page === "disposals") {
      window.history.pushState(null, "", "/disposals");
    } else if (page === "login") {
      window.history.pushState(null, "", "/login");
    } else {
      // For pages like "archives?tab=cit-lab-users"
      const url = queryString ? `/?${queryString}` : "/";
      window.history.pushState(null, "", url);
    }

    // Update URL params state
    setUrlParams(params);
  };

  return {
    currentPage,
    setCurrentPage,
    handleNavigate,
    urlParams,
  };
};
