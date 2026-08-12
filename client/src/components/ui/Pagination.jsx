import PropTypes from 'prop-types';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

/**
 * Simple page-number pagination bar.
 * Shows at most 5 page numbers centred around the current page.
 */
const Pagination = ({ page, pages, onPage }) => {
  if (pages <= 1) return null;

  // Build window of up to 5 pages
  const window = 2;
  let start = Math.max(1, page - window);
  let end   = Math.min(pages, page + window);
  if (end - start < 4) {
    if (start === 1) end   = Math.min(pages, start + 4);
    else             start = Math.max(1,     end   - 4);
  }
  const pageNums = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const btnBase = 'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors';
  const active  = 'bg-cyan-600 text-white';
  const inactive = 'border border-gray-200 text-gray-600 hover:bg-gray-50';
  const disabled = 'opacity-40 cursor-not-allowed border border-gray-200 text-gray-400';

  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={`${btnBase} ${page <= 1 ? disabled : inactive}`}
      >
        <MdChevronLeft size={18} />
      </button>

      {start > 1 && (
        <>
          <button type="button" onClick={() => onPage(1)} className={`${btnBase} ${inactive}`}>1</button>
          {start > 2 && <span className="px-1 text-gray-400">…</span>}
        </>
      )}

      {pageNums.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onPage(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`${btnBase} ${n === page ? active : inactive}`}
        >
          {n}
        </button>
      ))}

      {end < pages && (
        <>
          {end < pages - 1 && <span className="px-1 text-gray-400">…</span>}
          <button type="button" onClick={() => onPage(pages)} className={`${btnBase} ${inactive}`}>{pages}</button>
        </>
      )}

      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= pages}
        aria-label="Next page"
        className={`${btnBase} ${page >= pages ? disabled : inactive}`}
      >
        <MdChevronRight size={18} />
      </button>
    </nav>
  );
};

Pagination.propTypes = {
  page:   PropTypes.number.isRequired,
  pages:  PropTypes.number.isRequired,
  onPage: PropTypes.func.isRequired,
};

export default Pagination;
