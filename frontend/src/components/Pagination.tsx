import { ChevronLeft, ChevronRight } from 'lucide-react';
import s from './Pagination.module.css';

interface Props {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

function getPages(current: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | '...')[] = [1];
  let start = Math.max(2, current - 1);
  let end = Math.min(totalPages - 1, current + 1);
  if (current <= 3) {
    start = 2;
    end = 4;
  } else if (current >= totalPages - 2) {
    start = totalPages - 3;
    end = totalPages - 1;
  }
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push('...');
  pages.push(totalPages);
  return pages;
}

export default function Pagination({ page, total, pageSize, onChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  const pages = getPages(page, totalPages);

  return (
    <div className={s.wrap}>
      <button
        className={`${s.btn} ${page <= 1 ? s.disabled : ''}`}
        onClick={() => page > 1 && onChange(page - 1)}
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className={s.ellipsis}>...</span>
        ) : (
          <button
            key={p}
            className={`${s.btn} ${p === page ? s.active : ''}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button
        className={`${s.btn} ${page >= totalPages ? s.disabled : ''}`}
        onClick={() => page < totalPages && onChange(page + 1)}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
