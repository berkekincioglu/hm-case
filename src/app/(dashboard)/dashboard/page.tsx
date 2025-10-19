"use client";

import { PriceChart } from "@/components/dashboard/chart/price-chart";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto p-6 space-y-6">
        <PriceChart />
      </div>
    </div>
  );
}
