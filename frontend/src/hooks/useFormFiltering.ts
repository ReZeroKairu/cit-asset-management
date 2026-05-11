import { useState, useCallback, useMemo } from "react";
import { type FormSubmission } from "../types/forms";

export const useFormFiltering = (forms: FormSubmission[]) => {
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const filterByDate = useCallback(
    (form: FormSubmission) => {
      if (dateFilter === "all") return true;

      const formDate = new Date(form.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      switch (dateFilter) {
        case "today":
          return formDate >= today;
        case "yesterday":
          return formDate >= yesterday && formDate < today;
        case "last7days":
          return formDate >= lastWeek;
        case "last30days":
          return formDate >= lastMonth;
        default:
          return true;
      }
    },
    [dateFilter]
  );

  const { filteredForms, pendingCount } = useMemo(() => {
    const filtered = forms.filter((form) => {
      const matchesStatus = filter === "all" || form.status === filter;
      const matchesDate = filterByDate(form);
      return matchesStatus && matchesDate;
    });

    return {
      filteredForms: filtered,
      pendingCount: forms.filter(
        (f) => f.status === "Pending" && filterByDate(f)
      ).length,
    };
  }, [forms, filter, filterByDate]);

  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
  }, []);

  return {
    filter,
    setFilter,
    dateFilter,
    setDateFilter,
    filteredForms,
    pendingCount,
    handleFilterChange,
  };
};
