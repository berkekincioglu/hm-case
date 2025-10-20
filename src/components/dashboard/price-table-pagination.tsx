import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PriceTablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PriceTablePagination({
  currentPage,
  totalPages,
  onPageChange,
}: PriceTablePaginationProps) {
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | "ellipsis-left" | "ellipsis-right")[] = [];

    if (totalPages <= 6) {
      // Show all pages if 6 or fewer
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    if (currentPage <= 3) {
      // Near start: 1 2 3 4 ... last
      pages.push(2, 3, 4, "ellipsis-right", totalPages);
    } else if (currentPage >= totalPages - 2) {
      // Near end: 1 ... last-3 last-2 last-1 last
      pages.push(
        "ellipsis-left",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      // Middle: 1 ... current-1 current current+1 ... last
      pages.push(
        "ellipsis-left",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "ellipsis-right",
        totalPages
      );
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <Pagination className="flex items-center justify-end p-4 border-t">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) onPageChange(currentPage - 1);
            }}
            aria-disabled={currentPage === 1}
            className={
              currentPage === 1 ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>

        {getPageNumbers().map((page) => {
          if (page === "ellipsis-left" || page === "ellipsis-right") {
            return (
              <PaginationItem key={`ellipsis-${page}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(page);
                }}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < totalPages) onPageChange(currentPage + 1);
            }}
            aria-disabled={currentPage === totalPages}
            className={
              currentPage === totalPages ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
