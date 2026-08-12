import PropTypes from 'prop-types';

/** Single shimmer block */
export const SkeletonBlock = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} aria-hidden="true" />
);
SkeletonBlock.propTypes = { className: PropTypes.string };

/** Skeleton for a single table row (n columns) */
export const SkeletonRow = ({ cols = 5 }) => (
  <tr aria-hidden="true">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-3 animate-pulse rounded bg-gray-200" />
      </td>
    ))}
  </tr>
);
SkeletonRow.propTypes = { cols: PropTypes.number };

/** Full table skeleton */
export const TableSkeleton = ({ rows = 6, cols = 5 }) => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" aria-label="Loading…">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="px-4 py-3">
              <div className="h-2.5 w-20 animate-pulse rounded bg-gray-300" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} cols={cols} />)}
      </tbody>
    </table>
  </div>
);
TableSkeleton.propTypes = { rows: PropTypes.number, cols: PropTypes.number };

/** Card grid skeleton */
export const CardGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading…">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex justify-center">
          <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200" />
        </div>
        <div className="space-y-2 text-center">
          <div className="mx-auto h-3 w-24 animate-pulse rounded bg-gray-200" />
          <div className="mx-auto h-2.5 w-32 animate-pulse rounded bg-gray-200" />
          <div className="mx-auto h-5 w-16 animate-pulse rounded-full bg-gray-200" />
        </div>
      </div>
    ))}
  </div>
);
CardGridSkeleton.propTypes = { count: PropTypes.number };

/** Stat cards skeleton for analytics */
export const StatCardsSkeleton = ({ count = 5 }) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-label="Loading…">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="h-2.5 w-20 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-8 w-16 animate-pulse rounded bg-gray-300" />
      </div>
    ))}
  </div>
);
StatCardsSkeleton.propTypes = { count: PropTypes.number };

/** Chat history list skeleton */
export const HistorySkeleton = ({ rows = 6 }) => (
  <div className="space-y-2" aria-label="Loading…">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
        <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 flex gap-2">
          <div className="h-2.5 w-16 animate-pulse rounded bg-gray-200" />
          <div className="h-2.5 w-20 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    ))}
  </div>
);
HistorySkeleton.propTypes = { rows: PropTypes.number };

export default SkeletonBlock;
