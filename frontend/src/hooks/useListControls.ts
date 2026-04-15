import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export function getVisibleRange(total: number, page: number, pageSize: number, currentCount: number) {
  if (total === 0 || currentCount === 0) {
    return { start: 0, end: 0 };
  }

  const start = (page - 1) * pageSize + 1;
  return { start, end: start + currentCount - 1 };
}

export function useListControls() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') || '1');
  const resultsTopRef = useRef<HTMLDivElement | null>(null);
  const previousPageRef = useRef(page);

  useEffect(() => {
    if (page !== previousPageRef.current) {
      resultsTopRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
      previousPageRef.current = page;
    }
  }, [page]);

  const setFilter = (key: string, value: string, resetPage = true) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (resetPage) next.set('page', '1');
    setParams(next);
  };

  return {
    params,
    page,
    resultsTopRef,
    setFilter,
    setParams,
  };
}
