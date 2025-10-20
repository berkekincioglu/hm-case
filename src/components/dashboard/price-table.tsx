"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import moment from "moment";
import { useMemo, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useChart } from "@/contexts/chart-context";
import { useChartPrices } from "@/hooks/use-chart-prices";
import { formatPriceTooltip } from "@/lib/utils/chart-utils";
import { getCurrencySymbol } from "@/lib/utils/currency-utils";

import { PriceTablePagination } from "./price-table-pagination";
import { ErrorMessage } from "../shared/error-message";
import { LoadingSpinner } from "../shared/loading-spinner";
import { NoData } from "../shared/no-data";

type SortDirection = "asc" | "desc" | null;
type SortableColumn = "date" | "coin" | "currency" | "price";

interface TableRow {
  date?: string;
  coin?: string;
  currency?: string;
  price: number;
}

export function PriceTable() {
  const { filters } = useChart();
  const { breakdown, dateFrom, dateTo } = filters;
  const { data, isLoading, isError } = useChartPrices();

  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Determine which columns to show based on breakdown
  const showDate = breakdown.includes("date");
  const showCoin = breakdown.includes("coin");
  const showCurrency = breakdown.includes("currency");

  // Determine granularity for date formatting
  const daysDiff = moment(dateTo).diff(moment(dateFrom), "days", true);
  const granularity = daysDiff <= 2 ? "hourly" : "daily";

  // Transform API data into table rows
  const tableData = useMemo<TableRow[]>(() => {
    if (!data?.data?.data) return [];

    return data.data.data.map((item) => ({
      ...(showDate && { date: item.date }),
      ...(showCoin && { coin: item.coin }),
      ...(showCurrency && { currency: item.currency }),
      price: item.price,
    }));
  }, [data, showDate, showCoin, showCurrency]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return tableData;

    return [...tableData].sort((a, b) => {
      let aVal: string | number | undefined;
      let bVal: string | number | undefined;

      if (sortColumn === "date") {
        aVal = a.date ? new Date(a.date).getTime() : 0;
        bVal = b.date ? new Date(b.date).getTime() : 0;
      } else if (sortColumn === "price") {
        aVal = a.price;
        bVal = b.price;
      } else {
        aVal = a[sortColumn]?.toLowerCase() || "";
        bVal = b[sortColumn]?.toLowerCase() || "";
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [tableData, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, rowsPerPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedData.length]);

  // Handle column header click for sorting
  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Render sort icon
  const SortIcon = ({ column }: { column: SortableColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  // Format date based on granularity
  const formatDate = (dateString: string) => {
    if (granularity === "hourly") {
      return moment(dateString).format("MMM D, YYYY HH:mm");
    }
    return moment(dateString).format("MMM D, YYYY");
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <ErrorMessage message="Failed to load table data" />;
  }

  if (sortedData.length === 0) {
    return <NoData message="No price data available" />;
  }

  return (
    <div className="w-full rounded-lg border bg-card shadow-sm">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Price Data
            </h3>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {showDate && (
                <TableHead
                  className="cursor-pointer select-none hover:bg-accent/50 transition-colors"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center font-semibold text-foreground">
                    Date
                    <SortIcon column="date" />
                  </div>
                </TableHead>
              )}
              {showCoin && (
                <TableHead
                  className="cursor-pointer select-none hover:bg-accent/50 transition-colors"
                  onClick={() => handleSort("coin")}
                >
                  <div className="flex items-center font-semibold text-foreground">
                    Coin
                    <SortIcon column="coin" />
                  </div>
                </TableHead>
              )}
              {showCurrency && (
                <TableHead
                  className="cursor-pointer select-none hover:bg-accent/50 transition-colors"
                  onClick={() => handleSort("currency")}
                >
                  <div className="flex items-center font-semibold text-foreground">
                    Currency
                    <SortIcon column="currency" />
                  </div>
                </TableHead>
              )}
              <TableHead
                className="cursor-pointer select-none hover:bg-accent/50 text-right transition-colors"
                onClick={() => handleSort("price")}
              >
                <div className="flex items-center justify-end font-semibold text-foreground">
                  Price
                  <SortIcon column="price" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow key={index} className="hover:bg-accent/30">
                {showDate && row.date && (
                  <TableCell className="font-medium text-foreground">
                    <span className="text-sm">{formatDate(row.date)}</span>
                  </TableCell>
                )}
                {showCoin && row.coin && (
                  <TableCell>
                    <span className="capitalize text-base">{row.coin}</span>
                  </TableCell>
                )}
                {showCurrency && row.currency && (
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                        {getCurrencySymbol(row.currency)}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        {row.currency.toUpperCase()}
                      </span>
                    </span>
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <span className="font-mono font-bold text-base text-foreground">
                    {formatPriceTooltip(row.price)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PriceTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
