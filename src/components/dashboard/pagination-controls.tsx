import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import {
  getVisiblePageNumbers,
  type PaginationState,
} from "@/lib/pagination";
import { cn } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button";

interface PaginationControlsProps {
  basePath: string;
  pagination: PaginationState;
}

const buildPageHref = (basePath: string, page: number) => {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `${basePath}?${query}` : basePath;
};

export const PaginationControls = ({
  basePath,
  pagination,
}: PaginationControlsProps) => {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const visiblePages = getVisiblePageNumbers(
    pagination.currentPage,
    pagination.totalPages,
  );

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">
        Page {pagination.currentPage} of {pagination.totalPages}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {pagination.hasPreviousPage ? (
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={buildPageHref(basePath, pagination.currentPage - 1)}
          >
            <ChevronLeft className="size-3.5" />
            Previous
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "cursor-not-allowed opacity-50",
            )}
          >
            <ChevronLeft className="size-3.5" />
            Previous
          </span>
        )}

        {visiblePages.map((page, index) => {
          const previousPage = visiblePages[index - 1];
          const shouldShowGap = previousPage && page - previousPage > 1;

          return (
            <div key={page} className="flex items-center gap-2">
              {shouldShowGap ? (
                <span className="flex size-7 items-center justify-center text-muted-foreground">
                  <MoreHorizontal className="size-4" />
                </span>
              ) : null}

              <Link
                aria-current={page === pagination.currentPage ? "page" : undefined}
                className={buttonVariants({
                  variant: page === pagination.currentPage ? "default" : "outline",
                  size: "icon-sm",
                })}
                href={buildPageHref(basePath, page)}
              >
                <span className="sr-only">Page </span>
                {page}
              </Link>
            </div>
          );
        })}

        {pagination.hasNextPage ? (
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={buildPageHref(basePath, pagination.currentPage + 1)}
          >
            Next
            <ChevronRight className="size-3.5" />
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "cursor-not-allowed opacity-50",
            )}
          >
            Next
            <ChevronRight className="size-3.5" />
          </span>
        )}
      </div>
    </nav>
  );
};
