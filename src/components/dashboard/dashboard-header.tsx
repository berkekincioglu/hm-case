"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

import { ThemeToggle } from "../theme-toggle";

export function DashboardHeader() {
  const { logout } = useAuth();

  return (
    <div className="flex items-center justify-between border-b bg-card px-3 sm:px-6 py-3 sm:py-4">
      <h1 className="text-base sm:text-xl md:text-2xl font-bold">
        Hypermonk Case
      </h1>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <ThemeToggle />
        <Button
          variant="outline"
          onClick={logout}
          className="hidden sm:inline-flex"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
