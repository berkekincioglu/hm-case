"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ErrorMessage } from "@/components/shared/error-message";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { NoData } from "@/components/shared/no-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChart } from "@/contexts/chart-context";
import { useChartPrices } from "@/hooks/use-chart-prices";
import {
  formatChartDate,
  formatPrice,
  getSeriesColor,
  getSeriesKeys,
  transformPriceDataForChart,
} from "@/lib/utils/chart-utils";

import { ChartControls } from "./chart-controls";
import { CustomChartTooltip } from "./custom-chart-tooltip";

export function PriceChart() {
  const { filters, setZoomRange } = useChart();
  const { dateFrom, dateTo, breakdown } = filters;

  // Calculate days difference to determine granularity
  const daysDiff = Math.abs(
    (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // Show hourly if range is 2 days or less
  const granularity = daysDiff <= 2 ? "hourly" : "daily";

  const { data: response, isLoading, error } = useChartPrices();

  const chartData = useMemo(() => {
    if (!response?.data) return [];
    return transformPriceDataForChart(
      response.data.data,
      granularity,
      breakdown
    );
  }, [response, granularity, breakdown]);

  const seriesKeys = useMemo(() => getSeriesKeys(chartData), [chartData]);

  // Calculate appropriate tick interval for X-axis
  const xAxisTicks = useMemo(() => {
    if (chartData.length === 0) return undefined;

    // For daily view with many data points, show every few days
    if (granularity === "daily") {
      const dataLength = chartData.length;
      let interval = 1;

      // Adjust interval based on data length to show ~10-15 ticks
      if (dataLength > 60) {
        interval = Math.floor(dataLength / 10);
      } else if (dataLength > 30) {
        interval = Math.floor(dataLength / 12);
      } else if (dataLength > 15) {
        interval = Math.floor(dataLength / 10);
      }

      return chartData
        .filter((_, index) => index % interval === 0)
        .map((d) => d.date);
    }

    // For hourly view, show fewer ticks to avoid overcrowding
    const interval = Math.max(1, Math.floor(chartData.length / 12));
    return chartData
      .filter((_, index) => index % interval === 0)
      .map((d) => d.date);
  }, [chartData, granularity]);

  // Mouse selection state for zoom
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleMouseDown = (e: { activeLabel?: string }) => {
    if (e?.activeLabel) {
      setRefAreaLeft(e.activeLabel);
      setRefAreaRight(e.activeLabel);
      setIsSelecting(true);
    }
  };

  const handleMouseMove = (e: { activeLabel?: string }) => {
    if (isSelecting && e?.activeLabel) {
      setRefAreaRight(e.activeLabel);
    }
  };

  const handleMouseUp = () => {
    if (isSelecting && refAreaLeft && refAreaRight) {
      // Only zoom if there's a meaningful selection
      if (refAreaLeft !== refAreaRight) {
        // Parse dates - they could be in different formats (daily vs hourly)
        const leftDate = new Date(refAreaLeft);
        const rightDate = new Date(refAreaRight);

        // Ensure left is before right
        let from = leftDate < rightDate ? leftDate : rightDate;
        let to = leftDate < rightDate ? rightDate : leftDate;

        // For hourly data, keep the exact times
        // For daily data, expand to full day range
        if (granularity === "daily") {
          // Set from to start of day, to to end of day
          from = new Date(from.setHours(0, 0, 0, 0));
          to = new Date(to.setHours(23, 59, 59, 999));
        }

        // Only apply zoom if the dates are valid and different
        if (
          !isNaN(from.getTime()) &&
          !isNaN(to.getTime()) &&
          from.getTime() !== to.getTime()
        ) {
          setZoomRange(from, to);
        }
      }
    }

    // Reset selection area
    setRefAreaLeft(null);
    setRefAreaRight(null);
    setIsSelecting(false);
  };

  // Always show controls, even when loading/error/no data
  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    if (error) {
      return <ErrorMessage message="Failed to load price data" />;
    }

    if (chartData.length === 0) {
      return <NoData message="No price data for selected filters" />;
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          data={chartData}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <defs>
            {seriesKeys.map((key, index) => (
              <linearGradient
                key={key}
                id={`gradient-${key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={getSeriesColor(index)}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={getSeriesColor(index)}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            ticks={xAxisTicks}
            tickFormatter={(value) => formatChartDate(value, granularity)}
            className="text-xs"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            className="text-xs"
            tickFormatter={(value) => formatPrice(value)}
            width={80}
          />
          <Tooltip content={<CustomChartTooltip granularity={granularity} />} />
          {seriesKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={getSeriesColor(index)}
              fill={`url(#gradient-${key})`}
              strokeWidth={2}
            />
          ))}

          {/* Reference area for mouse selection */}
          {refAreaLeft && refAreaRight && (
            <ReferenceArea
              x1={refAreaLeft}
              x2={refAreaRight}
              strokeOpacity={0.3}
              fill="#3b82f6"
              fillOpacity={0.3}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Price Chart ({granularity === "hourly" ? "Hourly" : "Daily"})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartControls />
        {renderContent()}
      </CardContent>
    </Card>
  );
}
