"use client";

import moment from "moment";
import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

export type BreakdownDimension = "coin" | "currency" | "date";

interface DashboardFilters {
  selectedCoins: string[];
  selectedCurrencies: string[];
  dateFrom: Date;
  dateTo: Date;
  breakdown: BreakdownDimension[];
}

interface DashboardContextType {
  filters: DashboardFilters;
  updateFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

// Default filters as per requirements
const DEFAULT_FILTERS: DashboardFilters = {
  selectedCoins: ["bitcoin", "ethereum", "dogecoin"],
  selectedCurrencies: ["usd", "try"],
  dateFrom: moment().subtract(30, "days").toDate(), // Last 30 days
  dateTo: moment().toDate(), // Today
  breakdown: ["date"], // Default: show average price per date
};

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  const updateFilters = (newFilters: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <DashboardContext.Provider value={{ filters, updateFilters, resetFilters }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
