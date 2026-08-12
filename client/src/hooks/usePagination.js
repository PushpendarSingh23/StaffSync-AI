import { useState } from 'react';
import { clientConfig } from '../config/clientConfig';

/**
 * Simple pagination state management.
 * Returns { page, setPage, pageSize, resetPage }
 */
const usePagination = (pageSize = clientConfig.pageSize) => {
  const [page, setPage] = useState(1);

  const resetPage = () => setPage(1);

  return { page, setPage, pageSize, resetPage };
};

export default usePagination;
