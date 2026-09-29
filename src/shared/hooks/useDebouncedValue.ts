import { useEffect, useState } from 'react';

/** Valor que só muda depois que a pessoa para de digitar (evita uma busca por tecla). */
export function useDebouncedValue<T>(value: T): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), 300);
    return () => clearTimeout(timer);
  }, [value]);
  return debounced;
}
