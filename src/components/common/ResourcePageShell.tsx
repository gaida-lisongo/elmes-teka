import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export interface ResourcePageShellProps {
  title: string;
  description?: string;
  breadcrumbs?: React.ReactNode;
  metrics?: React.ReactNode;
  toolbar?: React.ReactNode;
  filters?: React.ReactNode;
  content: React.ReactNode;
  pagination?: React.ReactNode;
  drawer?: React.ReactNode;
  emptyState?: React.ReactNode;
}

export default function ResourcePageShell({
  title,
  description,
  breadcrumbs,
  metrics,
  toolbar,
  filters,
  content,
  pagination,
  drawer,
  emptyState,
}: ResourcePageShellProps) {
  return (
    <div>
      {/* Breadcrumb */}
      {breadcrumbs ?? <PageBreadcrumb pageTitle={title} />}

      {/* Description */}
      {description && (
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}

      {/* Metrics */}
      {metrics && <div className="mb-6">{metrics}</div>}

      {/* Toolbar */}
      {toolbar && <div className="mb-4">{toolbar}</div>}

      {/* Filters */}
      {filters && <div className="mb-4">{filters}</div>}

      {/* Content or Empty State */}
      {emptyState ?? (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {content}
        </div>
      )}

      {/* Pagination */}
      {pagination && <div className="mt-6">{pagination}</div>}

      {/* Drawer */}
      {drawer}
    </div>
  );
}