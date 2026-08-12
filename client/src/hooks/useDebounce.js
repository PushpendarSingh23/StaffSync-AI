import { useState, useEffect } from 'react';
import { clientConfig } from '../config/clientConfig';

/**
 * Returns a debounced version of `value`.
 * Updates only after `delay` ms of no changes (default 300 ms).
 */
const useDebounce = (value, delay = clientConfig.debounceMs) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
};

export default useDebounce;
